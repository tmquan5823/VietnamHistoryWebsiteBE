import HistoryDocument from "../models/historyDocument.model.js";
import ForumPost from "../models/forumPost.model.js";
import User from "../models/user.model.js";
import Period from "../models/period.model.js";
import QuizSet from "../models/quizSet.model.js";
import QuizLeaderboard from "../models/quizLeaderboard.model.js";
import { Sequelize } from "sequelize";
import DocumentType from "../models/documentType.model.js";

export const getHomePageData = async () => {
    // Lấy tất cả tài liệu type_id = 1, include period.description
    const documentsRaw = await HistoryDocument.findAll({
        where: { type_id: 1 },
        attributes: ["id", "image", "title", "start_year", "end_year", "period_id"],
        include: [
            {
                model: Period,
                attributes: ["description"],
            }
        ]
    });

    // Map để trả về description ở cấp cao nhất
    const documents = documentsRaw.map(doc => {
        const plain = doc.get({ plain: true });
        return {
            ...plain,
            description: plain.Period?.description || null,
            Period: undefined
        };
    });

    // Lấy 3 bài viết mới nhất
    const latestPosts = await ForumPost.findAll({
        order: [["createdAt", "DESC"]],
        limit: 3,
        attributes: ["id", "title", "createdAt"],
        include: [
            {
                model: User,
                as: "creator",
                attributes: ["id", "fullname", "email", "avatar"]
            }
        ]
    });

    // Lấy quizSet có nhiều người chơi nhất và status là 'publish'
    const quizSetWithMostPlayers = await QuizSet.findOne({
        where: { status: 'publish' },
        attributes: {
            include: [
                [Sequelize.fn("COUNT", Sequelize.col("QuizLeaderboards.id")), "playerCount"]
            ]
        },
        include: [
            {
                model: QuizLeaderboard,
                attributes: [],
            }
        ],
        group: ["QuizSet.id"],
        order: [[Sequelize.fn("COUNT", Sequelize.col("QuizLeaderboards.id")), "DESC"]],
        subQuery: false
    });

    let quizSet = null;
    let leaderboard = [];
    if (quizSetWithMostPlayers) {
        quizSet = quizSetWithMostPlayers.get({ plain: true });
        // Lấy leaderboard top 10 cho quizSet này
        leaderboard = await QuizLeaderboard.findAll({
            where: { quiz_id: quizSet.id },
            order: [["score", "DESC"]],
            limit: 10,
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "fullname", "email", "avatar"]
                }
            ]
        });
        leaderboard = leaderboard.map(lb => ({
            id: lb.id,
            user: lb.user,
            score: lb.score
        }));
        quizSet = { ...quizSet, leaderboard };
    }

    // Đếm số lượng người dùng role 'user'
    const userCounts = await User.count({ where: { role: 'user' } });

    return {
        documents,
        latestPosts,
        quizSetMostPlayers: quizSet,
        userCounts
    };
};

const getDashboardData = async () => {
    const userCount = await User.count({ where: { role: 'user' } });

    const allDocumentTypes = await DocumentType.findAll({ raw: true });

    const documentTypeCountsRaw = await HistoryDocument.findAll({
        attributes: [
            'type_id',
            [Sequelize.fn('COUNT', Sequelize.col('HistoryDocument.id')), 'count']
        ],
        group: ['type_id'],
        raw: true
    });
    const countMap = {};
    documentTypeCountsRaw.forEach(row => {
        countMap[row.type_id] = Number(row.count);
    });
    const documentCountsByType = allDocumentTypes.map(type => ({
        type_id: type.id,
        type_name: type.name,
        count: countMap[type.id] || 0
    })).sort((a, b) => a.type_id - b.type_id);

    const approvedForumPostCount = await ForumPost.count({ where: { status: 'approved' } });

    const publishedQuizSetCount = await QuizSet.count({ where: { status: 'publish' } });

    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const userCreatedByMonthRaw = await User.findAll({
        attributes: [
            [Sequelize.literal('EXTRACT(YEAR FROM "createdAt")'), 'year'],
            [Sequelize.literal('EXTRACT(MONTH FROM "createdAt")'), 'month'],
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: { role: 'user' },
        group: [
            Sequelize.literal('EXTRACT(YEAR FROM "createdAt")'),
            Sequelize.literal('EXTRACT(MONTH FROM "createdAt")')
        ],
        order: [
            [Sequelize.literal('EXTRACT(YEAR FROM "createdAt")'), 'ASC'],
            [Sequelize.literal('EXTRACT(MONTH FROM "createdAt")'), 'ASC']
        ],
        raw: true
    });
    const userCreatedMap = {};
    userCreatedByMonthRaw.forEach(row => {
        userCreatedMap[`${row.year}-${row.month}`] = Number(row.count);
    });
    const userCreatedByMonth = months.map(({ year, month }) => ({
        year,
        month,
        count: userCreatedMap[`${year}-${month}`] || 0
    }));

    return {
        userCount,
        documentCountsByType,
        approvedForumPostCount,
        publishedQuizSetCount,
        userCreatedByMonth
    };
}

export const dashboardService = {
    getHomePageData,
    getDashboardData
};


