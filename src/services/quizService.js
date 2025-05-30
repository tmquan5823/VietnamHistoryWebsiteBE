import dotenv from "dotenv";
import QuizSet from "../models/quizSet.model.js";
import User from "../models/user.model.js";
import { Op } from "sequelize";
import Topic from "../models/topic.model.js";
import BadRequestError from "../errors/BadRequestError.js";
import NotFoundError from "../errors/NotFoundError.js";
import ForbiddenError from "../errors/ForbiddenError.js";
import { sequelize } from "../database/connect.js";
import QuizQuestion from "../models/quizQuestion.model.js";
import QuizResult from "../models/quizHistory.model.js";
import QuizLeaderboard from "../models/quizLeaderboard.model.js";
import Notification from "../models/notification.model.js";

dotenv.config();

const getQuizSet = async (req) => {
    const { search, topic_id, sort_by, sort_order, status } = req.query;
    let { page, limit } = req.query;

    // Xây dựng điều kiện where
    const where = {};
    if (status !== undefined && status !== null && status !== "") {
        where.status = status;
    }
    if (search) {
        const likeOp = Op.iLike ? Op.iLike : Op.like;
        where[Op.or] = [
            { title: { [likeOp]: `%${search}%` } },
            { description: { [likeOp]: `%${search}%` } }
        ];
    }

    const topicInclude = {
        model: Topic,
        as: 'topics',
        attributes: ['id', 'name'],
        through: { attributes: [] }
    };
    if (topic_id) {
        topicInclude.where = { id: topic_id };
    }

    let order = [["createdAt", "DESC"]];
    let queryOptions = {
        where,
        include: [
            topicInclude,
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'fullname', 'email', 'avatar']
            }
        ]
    };
    if (sort_by && sort_by !== 'playerCount') {
        order = [[sort_by, sort_order && ["ASC", "DESC"].includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : "ASC"]];
        queryOptions.order = order;
    } else if (!sort_by) {
        queryOptions.order = order;
    }

    // Nếu không filter status, mặc định chỉ lấy publish và pending
    if (!status) {
        where.status = ['publish', 'pending', 'inactive'];
    }

    // Nếu có page và limit thì phân trang, nếu không thì trả về tất cả nhưng vẫn theo cấu trúc phân trang
    if (page !== undefined && limit !== undefined) {
        const pageNum = parseInt(page) > 0 ? parseInt(page) : 1;
        const limitNum = parseInt(limit) > 0 ? parseInt(limit) : 10;
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await QuizSet.findAndCountAll({
            ...queryOptions,
            offset,
            limit: limitNum,
            distinct: true
        });

        let data = await Promise.all(rows.map(async qs => ({
            id: qs.id,
            title: qs.title,
            description: qs.description,
            status: qs.status,
            createdAt: qs.createdAt,
            topics: qs.topics || [],
            image: qs.image,
            questionCount: await QuizQuestion.count({ where: { quiz_id: qs.id } }),
            creator: qs.creator ? {
                id: qs.creator.id,
                fullname: qs.creator.fullname,
                email: qs.creator.email,
                avatar: qs.creator.avatar
            } : null,
            playerCount: await QuizLeaderboard.count({ where: { quiz_id: qs.id } })
        })));

        if (sort_by === 'playerCount') {
            data.sort((a, b) => (b.playerCount || 0) - (a.playerCount || 0));
        }

        return {
            total: count,
            page: pageNum,
            limit: limitNum,
            data
        };
    } else {
        const quizSets = await QuizSet.findAll(queryOptions);
        let data = await Promise.all(quizSets.map(async qs => ({
            id: qs.id,
            title: qs.title,
            description: qs.description,
            status: qs.status,
            createdAt: qs.createdAt,
            topics: qs.topics || [],
            image: qs.image,
            questionCount: await QuizQuestion.count({ where: { quiz_id: qs.id } }),
            creator: qs.creator ? {
                id: qs.creator.id,
                fullname: qs.creator.fullname,
                email: qs.creator.email,
                avatar: qs.creator.avatar
            } : null,
            playerCount: await QuizLeaderboard.count({ where: { quiz_id: qs.id } })
        })));
        if (sort_by === 'playerCount') {
            data.sort((a, b) => (b.playerCount || 0) - (a.playerCount || 0));
        }
        return {
            total: data.length,
            page: 1,
            limit: data.length,
            data
        };
    }
};

const getPublishedQuizSet = async (req) => {
    const { status, search, topic_id, sort_by, sort_order, filter_type } = req.query;
    const user_id = req.userId;
    let { page, limit } = req.query;

    const where = { status: 'publish' };
    if (status) {
        where.status = status;
    }
    if (search) {
        const likeOp = Op.iLike ? Op.iLike : Op.like;
        where[Op.or] = [
            { title: { [likeOp]: `%${search}%` } },
            { description: { [likeOp]: `%${search}%` } }
        ];
    }

    const topicInclude = {
        model: Topic,
        as: 'topics',
        attributes: ['id', 'name'],
        through: { attributes: [] }
    };
    if (topic_id) {
        topicInclude.where = { id: topic_id };
    }

    let order = [["createdAt", "DESC"]];
    let queryOptions = {
        where,
        include: [
            topicInclude,
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'fullname', 'email', 'avatar']
            }
        ]
    };
    // Nếu sort_by không phải playerCount thì mới thêm order vào queryOptions
    if (sort_by && !['playerCount', 'score', 'ranking'].includes(sort_by)) {
        order = [[sort_by, sort_order && ["ASC", "DESC"].includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : "ASC"]];
        queryOptions.order = order;
    } else if (!sort_by) {
        queryOptions.order = order;
    }

    // Helper lấy leaderboard của user cho từng quiz, kèm ranking
    async function getUserLeaderboard(quiz_id) {
        if (!user_id) return {};
        // Lấy toàn bộ leaderboard để tính ranking
        const allLeaderboard = await QuizLeaderboard.findAll({
            where: { quiz_id },
            order: [
                ['score', 'DESC'],
                ['finished_at', 'ASC']
            ]
        });
        const entry = allLeaderboard.find(e => e.user_id === user_id);
        if (!entry) return {};
        const ranking = allLeaderboard.findIndex(e => e.user_id === user_id) + 1;
        return {
            id: entry.id,
            score: entry.score,
            is_finished: entry.is_finished,
            finished_at: entry.finished_at,
            ranking
        };
    }

    // Lấy tất cả quiz trước, filter, sort rồi mới phân trang
    const quizSets = await QuizSet.findAll(queryOptions);
    let data = await Promise.all(quizSets.map(async qs => ({
        id: qs.id,
        title: qs.title,
        description: qs.description,
        status: qs.status,
        createdAt: qs.createdAt,
        topics: qs.topics || [],
        image: qs.image,
        questionCount: await QuizQuestion.count({ where: { quiz_id: qs.id } }),
        creator: qs.creator ? {
            id: qs.creator.id,
            fullname: qs.creator.fullname,
            email: qs.creator.email,
            avatar: qs.creator.avatar
        } : null,
        playerCount: await QuizLeaderboard.count({ where: { quiz_id: qs.id } }),
        leaderboard: await getUserLeaderboard(qs.id)
    })));
    // --- FILTER ---
    data = filterQuizList(data, filter_type, user_id);
    // --- SORT ---
    if (sort_by === 'playerCount') {
        data.sort((a, b) => (sort_order === 'DESC' ? (b.playerCount || 0) - (a.playerCount || 0) : (a.playerCount || 0) - (b.playerCount || 0)));
    }
    if (sort_by === 'score') {
        data.sort((a, b) => {
            const aScore = a.leaderboard && typeof a.leaderboard.score === 'number' ? a.leaderboard.score : -Infinity;
            const bScore = b.leaderboard && typeof b.leaderboard.score === 'number' ? b.leaderboard.score : -Infinity;
            return (sort_order === 'ASC' ? aScore - bScore : bScore - aScore);
        });
    }
    if (sort_by === 'ranking') {
        data.sort((a, b) => {
            const aRank = a.leaderboard && typeof a.leaderboard.ranking === 'number' && a.leaderboard.ranking > 0 ? a.leaderboard.ranking : Infinity;
            const bRank = b.leaderboard && typeof b.leaderboard.ranking === 'number' && b.leaderboard.ranking > 0 ? b.leaderboard.ranking : Infinity;
            return (sort_order === 'ASC' ? aRank - bRank : bRank - aRank);
        });
    }
    // --- PHÂN TRANG ---
    const total = data.length;
    const pageNum = parseInt(page) > 0 ? parseInt(page) : 1;
    const limitNum = parseInt(limit) > 0 ? parseInt(limit) : 10;
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const pageData = data.slice(start, end);
    return {
        total,
        page: pageNum,
        limit: limitNum,
        data: pageData
    };
}

// Hàm filter danh sách quiz theo filter_type
function filterQuizList(data, filter_type, user_id) {
    if (!filter_type || filter_type === 'all') return data;
    if (filter_type === 'mine' && user_id) {
        return data.filter(q => q.creator && q.creator.id === user_id);
    }
    if (filter_type === 'not_played') {
        return data.filter(q => (!q.leaderboard || Object.keys(q.leaderboard).length === 0) && (!q.creator || q.creator.id !== user_id));
    }
    if (filter_type === 'not_finished') {
        return data.filter(q => q.leaderboard && 'is_finished' in q.leaderboard && q.leaderboard.is_finished === false);
    }
    if (filter_type === 'finished') {
        return data.filter(q => q.leaderboard && 'is_finished' in q.leaderboard && q.leaderboard.is_finished === true);
    }
    return data;
}

const getQuizSetByToken = async (req) => {
    const { status, search, topic_id, sort_by, sort_order } = req.query;
    const userId  = req.userId;
    let { page, limit } = req.query;

    if (!userId) {
        throw new BadRequestError("Thiếu userId!");
    }

    const where = { created_by: userId };
    if (status) {
        where.status = status;
    }
    else {
        // Nếu không truyền status, loại bỏ quiz publish và inactive
        where.status = { [Op.notIn]: ['publish', 'inactive'] };
    }
    if (search) {
        const likeOp = Op.iLike ? Op.iLike : Op.like;
        where[Op.or] = [
            { title: { [likeOp]: `%${search}%` } },
            { description: { [likeOp]: `%${search}%` } }
        ];
    }

    const topicInclude = {
        model: Topic,
        as: 'topics',
        attributes: ['id', 'name'],
        through: { attributes: [] }
    };
    if (topic_id) {
        topicInclude.where = { id: topic_id };
    }

    let order = [["createdAt", "DESC"]];
    let queryOptions = {
        where,
        include: [
            topicInclude
        ]
    };
    // Nếu sort_by không phải playerCount thì mới thêm order vào queryOptions
    if (sort_by && sort_by !== 'playerCount') {
        order = [[sort_by, sort_order && ["ASC", "DESC"].includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : "ASC"]];
        queryOptions.order = order;
    } else if (!sort_by) {
        queryOptions.order = order;
    }

    if (page !== undefined && limit !== undefined) {
        const pageNum = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
        const limitNum = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
        const offset = (pageNum - 1) * limitNum;

        const { count, rows } = await QuizSet.findAndCountAll({
            ...queryOptions,
            offset,
            limit: limitNum,
            distinct: true
        });

        return {
            total: count,
            page: pageNum,
            limit: limitNum,
            data: await Promise.all(rows.map(async qs => ({
                id: qs.id,
                title: qs.title,
                description: qs.description,
                status: qs.status,
                createdAt: qs.createdAt,
                topics: qs.topics || [],
                image: qs.image,
                questionCount: await QuizQuestion.count({ where: { quiz_id: qs.id } })
            })))
        };
    } else {
        const quizSets = await QuizSet.findAll(queryOptions);
        const data = await Promise.all(quizSets.map(async qs => ({
            id: qs.id,
            title: qs.title,
            description: qs.description,
            status: qs.status,
            createdAt: qs.createdAt,
            topics: qs.topics || [],
            image: qs.image,
            questionCount: await QuizQuestion.count({ where: { quiz_id: qs.id } })
        })));
        return {
            total: data.length,
            page: 1,
            limit: data.length,
            data
        };
    }
};

const getPublishQuizSet = async (req) => {
    const quizSets = await QuizSet.findAll({
        where: { status: 'publish' },
        include: [
            {
                model: Topic,
                as: 'topics',
                attributes: ['id', 'name'],
                through: { attributes: [] }
            },
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'fullname', 'email', 'avatar']
            }
        ]
    });
    return quizSets;
};

const createQuizSet = async (data) => {
    let { image, title, description, created_by, topic_ids } = data.body;

    if (typeof topic_ids === 'string') {
        try {
            topic_ids = JSON.parse(topic_ids);
            if (!Array.isArray(topic_ids)) throw new Error();
        } catch {
            topic_ids = topic_ids.split(' ').map(Number).filter(Boolean);
        }
    }

    const quizSet = await QuizSet.create({ image, title, description, created_by, status: 'unpublish' });
    if (topic_ids && Array.isArray(topic_ids) && topic_ids.length > 0) {
        await quizSet.setTopics(topic_ids); 
    }

    const quizSetDetail = await QuizSet.findByPk(quizSet.id, {
        include: [
            {
                model: Topic,
                as: 'topics',
                attributes: ['id', 'name'],
                through: { attributes: [] }
            }
        ]
    });
    // Chỉ trả về các trường cần thiết
    return {
        id: quizSetDetail.id,
        title: quizSetDetail.title,
        description: quizSetDetail.description,
        status: quizSetDetail.status,
        createdAt: quizSetDetail.createdAt,
        topics: quizSetDetail.topics || []
    };
};

const getQuizSetById = async (data) => {
    const { id } = data.params;
    const user_id = data.userId;
    const role = data.role;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    const quizSet = await QuizSet.findByPk(id, {
        include: [
            {
                model: Topic,
                as: 'topics',
                attributes: ['id', 'name'],
                through: { attributes: [] }
            },
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'fullname', 'email', 'avatar']
            }
        ]
    });
    if (!quizSet) {
        throw new NotFoundError("Không tìm thấy quiz set");
    }

    // Quyền truy cập
    const allowedStatuses = ['pending', 'publish', 'inactive'];
    if (
        role !== 'admin' &&
        quizSet.status !== 'publish' &&
        user_id !== quizSet.created_by
    ) {
        throw new ForbiddenError("Bạn không có quyền truy cập vào quiz set này");
    }
    if (
        role === 'admin' &&
        !allowedStatuses.includes(quizSet.status)
    ) {
        throw new ForbiddenError("Admin chỉ được truy cập quiz set ở trạng thái pending, publish, inactive");
    }

    // Chỉ trả về các trường cần thiết
    const playerCount = await QuizLeaderboard.count({ where: { quiz_id: quizSet.id } });
    return {
        id: quizSet.id,
        title: quizSet.title,
        description: quizSet.description,
        status: quizSet.status,
        createdAt: quizSet.createdAt,
        topics: quizSet.topics || [],
        creator: quizSet.creator || {},
        image: quizSet.image,
        questionCount: await QuizQuestion.count({ where: { quiz_id: quizSet.id } }),
        playerCount
    };
};

const updateQuizSet = async (req) => {
    const { id } = req.params;
    const user_id = req.userId;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    let { image, title, description, created_by, topic_ids } = req.body;
    if (typeof topic_ids === 'string') {
        try {
            topic_ids = JSON.parse(topic_ids);
            if (!Array.isArray(topic_ids)) throw new Error();
        } catch {
            topic_ids = topic_ids.split(' ').map(Number).filter(Boolean);
        }
    }
    const quizSet = await QuizSet.findByPk(id);
    if (!quizSet) {
        throw new NotFoundError("Không tìm thấy bộ câu hỏi");
    }
    if(quizSet.status !== 'publish' && user_id !== quizSet.created_by){
        throw new ForbiddenError("Bạn không có quyền truy cập vào quiz set này");
    }
    await QuizSet.update({ image, title, description, created_by }, { where: { id } });
    if (topic_ids && Array.isArray(topic_ids)) {
        await quizSet.setTopics(topic_ids);
    }
    const quizSetDetail = await QuizSet.findByPk(id, {
        include: [
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'fullname', 'email', 'avatar']
            },
            {
                model: Topic,
                as: 'topics',
                attributes: ['id', 'name'],
                through: { attributes: [] }
            }
        ]
    });
    return quizSetDetail;
};

const deleteQuizSet = async (data) => {
    const { id } = data.params;
    const user_id = data.userId;
    const role = data.role;
    const quizSet = await QuizSet.findByPk(id);
    if (!quizSet) {
        throw new NotFoundError("Không tìm thấy bộ câu hỏi");
    }
    if (role !== 'admin') {
        if (quizSet.status === 'publish' || user_id !== quizSet.created_by) {
            throw new ForbiddenError("Bạn không có quyền truy cập vào quiz set này");
        }
    }
    await quizSet.setTopics([]);
    await QuizQuestion.destroy({ where: { quiz_id: id } });
    await quizSet.destroy();
    return { success: !!quizSet };
};

// Gửi duyệt quiz (user gửi admin duyệt)
const submitQuizSetForApproval = async (data) => {
    const { id } = data.params;
    const user_id = data.userId;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    const quizSet = await QuizSet.findByPk(id);
    if (!quizSet) {
        throw new NotFoundError("Không tìm thấy bộ câu hỏi");
    }
    if (quizSet.status !== 'unpublish') {
        throw new BadRequestError("Chỉ có thể gửi duyệt bộ câu hỏi chưa công khai");
    }
    if(user_id !== quizSet.created_by){
        throw new ForbiddenError("Bạn không có quyền truy cập vào quiz set này");
    }
    await QuizSet.update({ status: 'pending' }, { where: { id } });
    quizSet.status = 'pending';

    // Gửi thông báo cho tất cả admin
    const admins = await User.findAll({ where: { role: 'admin' } });
    const notifications = await Promise.all(
        admins.map(admin =>
            Notification.create({
                user_id: admin.id,
                title: "Yêu cầu duyệt bộ câu hỏi mới",
                content: `Bộ câu hỏi "${quizSet.title}" đã được gửi duyệt.`,
                is_read: false,
                type: 'quiz',
                url: `/quiz/${quizSet.id}`
            })
        )
    );

    // Nếu có socket, có thể emit cho admin:
    if (typeof data.io === "object" && data.io.emit) {
        notifications.forEach(notification => {
            data.io.emit("newNotification", notification.toJSON());
        });
    }

    return quizSet;
};

// Admin duyệt quiz
const approveQuizSet = async (req) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    // Lấy quizSet gốc (cả topic)
    const quizSet = await QuizSet.findByPk(id, {
        raw: true
    });
    if (!quizSet) {
        throw new NotFoundError("Không tìm thấy bộ câu hỏi");
    }
    if (quizSet.status !== 'pending') {
        throw new BadRequestError("Chỉ có thể duyệt bộ câu hỏi đang chờ duyệt");
    }

    // Tạo bản copy với status publish
    const { id: oldId, status, createdAt, updatedAt, ...copyData } = quizSet;
    const publishedQuiz = await QuizSet.create({
        ...copyData,
        status: 'publish'   
    });

    // Copy topic từ quiz gốc sang quiz mới
    const oldQuizSetWithTopics = await QuizSet.findByPk(oldId, {
        include: [{ model: Topic, as: 'topics', attributes: ['id'] }]
    });
    const topicIds = oldQuizSetWithTopics.topics.map(t => t.id);
    await publishedQuiz.setTopics(topicIds);

    // Copy toàn bộ câu hỏi sang quiz mới
    const questions = await QuizQuestion.findAll({ where: { quiz_id: oldId }, raw: true });
    if (questions.length > 0) {
        const copiedQuestions = questions.map(q => {
            const { id, quiz_id, createdAt, updatedAt, ...rest } = q;
            return {
                ...rest,
                quiz_id: publishedQuiz.id
            };
        });
        await QuizQuestion.bulkCreate(copiedQuestions);
    }

    // Cập nhật bản gốc thành approved
    await QuizSet.update({ status: 'approved' }, { where: { id } });
    const notification = await Notification.create({
        user_id: quizSet.created_by,
        title: "Quiz đã được phê duyệt",
        content: `Quiz "${publishedQuiz.title}" đã được admin phê duyệt!`,
        is_read: false,
        type: 'approved',
        url: `/quiz/${publishedQuiz.id}`
    });
    req.io.emit("newNotification", notification.toJSON());
    // Trả về cả hai bản
    return {
        original: { ...quizSet, status: 'approved' },
        published: publishedQuiz
    };
};

// Admin từ chối duyệt quiz
const rejectQuizSet = async (req) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    const quizSet = await QuizSet.findByPk(id);
    if (!quizSet) {
        throw new NotFoundError("Không tìm thấy bộ câu hỏi");
    }
    if (quizSet.status !== 'pending') {
        throw new BadRequestError("Chỉ có thể từ chối bộ câu hỏi đang chờ duyệt");
    }
    await QuizSet.update({ status: 'unpublish' }, { where: { id } });
    quizSet.status = 'unpublish';
    const notification = await Notification.create({
        user_id: quizSet.created_by,
        title: "Quiz bị từ chối",
        content: `Quiz "${quizSet.title}" đã bị admin từ chối. Lý do: ${req.body.reject_reason || "Không rõ"}`,
        is_read: false,
        type: 'rejected',
        url: `/my-quiz/${quizSet.id}`
    });
    req.io.emit("newNotification", notification.toJSON());
    return quizSet;
};

// Hủy publish (user hoặc admin)
const unpublishQuizSet = async (data) => {
    const { id } = data.params;
    const user_id = data.userId;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    const quizSet = await QuizSet.findByPk(id);
    if (!quizSet) {
        throw new NotFoundError("Không tìm thấy bộ câu hỏi");
    }
    if (quizSet.status !== 'publish' && quizSet.status !== 'pending') {
        throw new BadRequestError("Chỉ có thể hủy publish bộ câu hỏi đang công khai hoặc đang chờ duyệt");
    }
    if(user_id !== quizSet.created_by){
        throw new ForbiddenError("Bạn không có quyền truy cập vào quiz set này");
    }
    await QuizSet.update({ status: 'unpublish' }, { where: { id } });
    quizSet.status = 'unpublish';
    return quizSet;
};

const inactivePublishQuizSet = async (data) => {
    const { id } = data.params;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    const quizSet = await QuizSet.findByPk(id);
    if (!quizSet) {
        throw new NotFoundError("Không tìm thấy bộ câu hỏi");
    }
    if (quizSet.status !== 'publish') {
        throw new BadRequestError("Chỉ có thể hủy publish bộ câu hỏi đang công khai");
    }
    await QuizSet.update({ status: 'inactive' }, { where: { id } });
    quizSet.status = 'inactive';
    // Gửi notification cho creator khi cancel publish
    const reject_reason = data.body && data.body.reject_reason ? data.body.reject_reason : null;
    const notification = await Notification.create({
        user_id: quizSet.created_by,
        title: "Bộ câu hỏi bị vô hiệu hóa",
        content: `Quiz \"${quizSet.title}\" đã bị vô hiệu hóa.${reject_reason ? ' Lý do: ' + reject_reason : ''}`,
        is_read: false,
        type: 'rejected',
    });
    if (data.io) {
        data.io.emit("newNotification", notification.toJSON());
    }
    return quizSet;
};

const publishQuizSet = async (data) => {
    const { id } = data.params;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    const quizSet = await QuizSet.findByPk(id);
    if (!quizSet) {
        throw new NotFoundError("Không tìm thấy bộ câu hỏi");
    }
    if (quizSet.status !== 'inactive') {
        throw new BadRequestError("Chỉ có thể publish bộ câu hỏi đang vô hiệu hóa");
    }   
    await QuizSet.update({ status: 'publish' }, { where: { id } });
    quizSet.status = 'publish';
    return quizSet;
};

const createQuizSetWithQuestions = async (data) => {
    const t = await sequelize.transaction();
    try {
        // 1. Tạo QuizSet
        let { image, title, description, topic_ids, questions, status } = data.body;
        console.log(data);
        const user_id = data.userId;
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            throw new BadRequestError("Không có câu hỏi");
        }

        if(status === 'publish'){
            throw new ForbiddenError("Bạn không có quyền tạo bộ câu hỏi đang công khai");
        }
        // Xử lý topic_ids như createQuizSet
        if (typeof topic_ids === 'string') {
            try {
                topic_ids = JSON.parse(topic_ids);
                if (!Array.isArray(topic_ids)) throw new Error();
            } catch {
                topic_ids = topic_ids.split(' ').map(Number).filter(Boolean);
            }
        }

        const quizSet = await QuizSet.create(
            { image, title, description, created_by: user_id, status: status },
            { transaction: t }
        );
        if (topic_ids && Array.isArray(topic_ids) && topic_ids.length > 0) {
            await quizSet.setTopics(topic_ids, { transaction: t });
        }

        // 2. Tạo các câu hỏi
        questions = questions.map(q => ({
            ...q,
            quiz_id: quizSet.id,
            action: q.action || 'created'
        }));
        const quizQuestions = await QuizQuestion.bulkCreate(questions, { transaction: t });

        // 3. Commit transaction
        await t.commit();

        // 4. Lấy lại thông tin QuizSet (có thể include topics)
        const quizSetDetail = await QuizSet.findByPk(quizSet.id, {
            include: [
                {
                    model: Topic,
                    as: 'topics',
                    attributes: ['id', 'name'],
                    through: { attributes: [] }
                }
            ]
        });

        return {
            quizSet: {
                id: quizSetDetail.id,
                title: quizSetDetail.title,
                description: quizSetDetail.description,
                status: quizSetDetail.status,
                createdAt: quizSetDetail.createdAt,
                topics: quizSetDetail.topics || [],
                updatedAt: quizSetDetail.updatedAt
            },
            questions: quizQuestions
        };
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

const getQuizSetWithQuestions = async (data) => {
    const { id } = data.params;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    // Lấy quizSet kèm topics
    const quizSet = await QuizSet.findByPk(id, {
        include: {
            model: Topic,
            as: 'topics',
            attributes: ['id', 'name'],
            through: { attributes: [] }
        }
    });
    if (!quizSet) {
        throw new NotFoundError("Không tìm thấy quiz set");
    }

    // Lấy danh sách câu hỏi
    const questions = await QuizQuestion.findAll({
        where: { quiz_id: id },
        order: [['number', 'ASC']]
    });

    // Lấy mảng topic_ids
    const topic_ids = quizSet.topics ? quizSet.topics.map(t => t.id) : [];

    return {
        id: quizSet.id,
        image: quizSet.image,
        title: quizSet.title,
        description: quizSet.description,
        topic_ids,
        status: quizSet.status,
        updatedAt: quizSet.updatedAt,
        questions
    };
};

const getQuizSetWithQuestionsForPlay = async (data) => {
    const { id } = data.params;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    const quizSet = await QuizSet.findByPk(id, {
        include: [
            {
                model: Topic,
                as: 'topics',
                attributes: ['id', 'name'],
                through: { attributes: [] }
            },
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'fullname', 'email', 'avatar']
            }
        ]   
    });
    if (!quizSet) {
        throw new NotFoundError("Không tìm thấy quiz set");
    }
    const questions = await QuizQuestion.findAll({
        where: {  quiz_id: id },
        order: [['number', 'ASC']]
    });
    const questionCount = await questions.length;
    // Loại bỏ correct_answers và funfact khỏi mỗi question
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    const questionsForPlay = questions.map(q => {
        const { quiz_id, image_public_id, createdAt, updatedAt, correct_answers, funfact, ...rest } = q.toJSON();
        // Trộn options nếu có
        if (rest.options) {
            try {
                let opts = JSON.parse(rest.options);
                if (Array.isArray(opts)) {
                    opts = shuffleArray(opts);
                    rest.options = JSON.stringify(opts);
                }
            } catch (e) {
                // Nếu không parse được thì bỏ qua
            }
        }
        return rest;
    });
    return {
        id: quizSet.id,
        image: quizSet.image,
        title: quizSet.title,
        description: quizSet.description,
        topics: quizSet.topics || [],
        status: quizSet.status,
        createdAt: quizSet.createdAt,
        creator: quizSet.creator,
        questionCount,
        questions: questionsForPlay,
    };
}

const updateQuizSetWithQuestions = async (data) => {
    const t = await sequelize.transaction();
    try {
        let { id, image, title, description, topic_ids, questions, status } = data.body;
        if (!id) throw new BadRequestError("Thiếu id");
        // Lấy quiz set hiện tại
        const quizSet = await QuizSet.findByPk(id, { transaction: t });
        if (!quizSet) throw new NotFoundError("Quiz set không tồn tại");

        // Nếu không truyền status thì đặt lại là 'unpublish'
        if (status === 'approved' || status === null) {
            status = 'unpublish';
        }
        if(status === 'publish'){
            throw new ForbiddenError("Bạn không có quyền cập nhật bộ câu hỏi đang công khai");
        }
        // Xử lý topic_ids
        if (typeof topic_ids === 'string') {
            try {
                topic_ids = JSON.parse(topic_ids);
                if (!Array.isArray(topic_ids)) throw new Error();
            } catch {
                topic_ids = topic_ids.split(' ').map(Number).filter(Boolean);
            }
        }

        // Cập nhật quiz set
        await quizSet.update(
            {
                image,
                title,
                description,
                status,
                updatedAt: new Date()
            },
            { transaction: t }
        );

        // Cập nhật topics
        if (topic_ids && Array.isArray(topic_ids)) {
            await quizSet.setTopics(topic_ids, { transaction: t });
        }

        // Xử lý questions: Cập nhật/xóa/thêm từng câu hỏi thay vì xóa hết tạo lại
        if (questions && Array.isArray(questions)) {
            // 1. Lấy danh sách id câu hỏi cũ
            const oldQuestions = await QuizQuestion.findAll({ where: { quiz_id: id }, transaction: t });
            const oldIds = oldQuestions.map(q => q.id);

            // 2. Lấy danh sách id câu hỏi mới (có id)
            const newIds = questions.filter(q => q.id).map(q => q.id);

            // 3. Xác định id cần xóa
            const idsToDelete = oldIds.filter(oldId => !newIds.includes(oldId));
            if (idsToDelete.length > 0) {
                await QuizQuestion.destroy({ where: { id: idsToDelete }, transaction: t });
            }

            // 4. Cập nhật các câu hỏi cũ
            for (const q of questions) {
                if (q.id) {
                    // Không update id, quiz_id
                    const { id: qid, quiz_id, ...updateFields } = q;
                    await QuizQuestion.update(
                        { ...updateFields },
                        { where: { id: q.id }, transaction: t }
                    );
                }
            }

            // 5. Thêm mới các câu hỏi chưa có id
            const newQuestions = questions.filter(q => !q.id).map(q => ({ ...q, quiz_id: id }));
            if (newQuestions.length > 0) {
                await QuizQuestion.bulkCreate(newQuestions, { transaction: t });
            }
        }

        await t.commit();

        // Lấy lại quiz set chi tiết
        const quizSetDetail = await QuizSet.findByPk(id, {
            include: [
                {
                    model: Topic,
                    as: 'topics',
                    attributes: ['id', 'name'],
                    through: { attributes: [] }
                }
            ]
        });

        // Lấy lại questions
        const quizQuestions = await QuizQuestion.findAll({ where: { quiz_id: id } });

        return {
            quizSet: {
                id: quizSetDetail.id,
                title: quizSetDetail.title,
                description: quizSetDetail.description,
                status: quizSetDetail.status,
                createdAt: quizSetDetail.createdAt,
                topics: quizSetDetail.topics || [],
                updatedAt: quizSetDetail.updatedAt
            },
            questions: quizQuestions
        };
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

const getQuizResults = async (data) => {
    const user_id = data.userId;
    const { id } = data.params;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    const quizResults = await QuizResult.findAll({
        where: {
            quiz_set_id: id,
            user_id: user_id
        },
        include: [{
            model: QuizQuestion,
            as: 'question', // Đảm bảo association đúng tên alias
            attributes: ['number']
        }]
    });

    // Map để thêm trường number vào từng kết quả
    const quizResultsWithNumber = quizResults.map(qr => {
        const qrObj = qr.toJSON();
        return {
            ...qrObj,
            number: qrObj.question?.number
        };
    });

    // Lấy toàn bộ leaderboard để tính ranking
    const allLeaderboard = await QuizLeaderboard.findAll({
        where: { quiz_id: id },
        order: [
            ['score', 'DESC'],
            ['finished_at', 'ASC']
        ]
    });

    // Tìm vị trí của user hiện tại
    const ranking = allLeaderboard.findIndex(
        entry => entry.user_id === user_id
    ) + 1; // +1 vì index bắt đầu từ 0

    // Lấy record của user hiện tại
    const leaderboard = allLeaderboard.find(entry => entry.user_id === user_id);

    return {
        quizResults: quizResultsWithNumber,
        leaderboard: leaderboard ? { ...leaderboard.toJSON(), ranking } : null
    }
}

const getQuizLeaderboard = async (data) => {
    const { id } = data.params;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    const leaderboard = await QuizLeaderboard.findAll({
        where: { quiz_id: id },
        order: [
            ['score', 'DESC'],
            ['finished_at', 'ASC']
        ],
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'fullname', 'email', 'avatar']
            }
        ]
    });

    // Đưa thông tin user vào kết quả trả về
    return leaderboard.map(entry => {
        const data = entry.toJSON();
        return {
            ...data,
            user: data.user
        };
    });
}

export const quizService = {
    getQuizSet,
    getPublishedQuizSet,
    createQuizSet,
    getQuizSetById,
    updateQuizSet,
    deleteQuizSet,
    submitQuizSetForApproval,
    approveQuizSet,
    rejectQuizSet,
    unpublishQuizSet,
    publishQuizSet,
    inactivePublishQuizSet,
    getPublishQuizSet,
    getQuizSetByToken,
    createQuizSetWithQuestions,
    getQuizSetWithQuestions,
    updateQuizSetWithQuestions,
    getQuizSetWithQuestionsForPlay,
    getQuizResults,
    getQuizLeaderboard,
};