import ForumPost from "../models/forumPost.model.js";
import Topic from "../models/topic.model.js";
import BadRequestError from "../errors/BadRequestError.js";
import NotFoundError from "../errors/NotFoundError.js";
import ForbiddenError from "../errors/ForbiddenError.js";
import ForumPostTopic from "../models/forumPostTopic.model.js";
import User from "../models/user.model.js";
import ForumPostVersion from "../models/ForumPostVersion.model.js";
import Notification from "../models/notification.model.js";
import { Op, Sequelize } from "sequelize";
import SavePost from "../models/savePost.model.js";

const createForumPost = async (req) => {
    const created_by = req.userId;
    let { title, content, topic_id, status } = req.body;

    if (!title || !content) {
        throw new BadRequestError("Thiếu thông tin bắt buộc!");
    }

    if (typeof topic_id === 'string') {
        try {
            topic_id = JSON.parse(topic_id);
            if (!Array.isArray(topic_id)) throw new Error();
        } catch {
            topic_id = topic_id.split(' ').map(Number).filter(Boolean);
        }
    }
    if (!Array.isArray(topic_id)) {
        topic_id = [topic_id];
    }

    const topics = await Topic.findAll({ where: { id: topic_id } });
    if (topics.length !== topic_id.length) {
        throw new NotFoundError("Một hoặc nhiều chủ đề không tồn tại!");
    }

    // Xử lý status
    let postStatus = 'pending';
    if (typeof status !== 'undefined' && status !== 'pending') {
        postStatus = 'local';
    }

    const forumPost = await ForumPost.create({
        title,
        content,
        created_by,
        status: postStatus
    });

    for (const tid of topic_id) {
        await ForumPostTopic.create({
            forum_post_id: forumPost.id,
            topic_id: tid
        });
    }

    const forumPostDetail = await ForumPost.findByPk(forumPost.id, {
        include: [
            {
                model: ForumPostTopic,
                include: [
                    {
                        model: Topic,
                        attributes: ['id', 'name']
                    }
                ]
            }
        ]
    });

    // Gửi notification cho admin khi có bài viết mới cần duyệt
    const admins = await User.findAll({ where: { role: 'admin' } });
    const notifications = await Promise.all(
        admins.map(admin =>
            Notification.create({
                user_id: admin.id,
                title: "Bài viết mới cần duyệt",
                content: `Bài viết \"${forumPost.title}\" vừa được tạo và cần duyệt.`,
                is_read: false,
                type: 'post',
                url: `/forum/${forumPost.id}`
            })
        )
    );
    if (req.io && typeof req.io.emit === "function") {
        notifications.forEach(notification => {
            req.io.emit("newNotification", notification.toJSON());
        });
    }

    return {
        id: forumPostDetail.id,
        title: forumPostDetail.title,
        content: forumPostDetail.content,
        created_by: forumPostDetail.created_by,
        topics: forumPostDetail.ForumPostTopics?.map(fpt => fpt.Topic) || [],
        status: forumPostDetail.status
    };
};

const getForumPosts = async (req) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { search, status, topic_id, sort_by, sort_order } = req.query;

    const where = { status: { [Op.notIn]: ['local', 'rejected'] } };

    if (search) {
        where[Op.or] = [
            { title: { [Op.iLike]: `%${search}%` } },
            { content: { [Op.iLike]: `%${search}%` } }
        ];
    }
    if (status) {
        where.status = status;
    }

    let include = [
        {
            model: ForumPostTopic,
            include: [
                {
                    model: Topic,
                    attributes: ['id', 'name']
                }
            ]
        },
        {
            model: User,
            as: 'creator',
            attributes: ['id', 'fullname', 'email', 'avatar']
        }
    ];
    if (topic_id) {
        include[0].where = { topic_id: topic_id };
    }

    // Sắp xếp
    let order = [
        [
            sort_by || 'createdAt',
            (sort_order && ['ASC', 'DESC'].includes(sort_order.toUpperCase()))
                ? sort_order.toUpperCase()
                : 'DESC'
        ]
    ];

    const total = await ForumPost.count({ where, include });

    const forumPosts = await ForumPost.findAll({
        where,
        include,
        limit,
        offset,
        order
    });

    return {
        data: forumPosts.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            created_by: post.created_by,
            creator: post.creator,
            topics: post.ForumPostTopics?.map(fpt => fpt.Topic) || [],
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            status: post.status
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

const getApprovedForumPosts = async (req) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { search, topic_id, sort_by, sort_order, user_id } = req.query;
    const currentUserId = req.userId;

    const where = { status: "approved" };

    if (user_id) {
        where.created_by = user_id;
    }

    if (search) {
        where[Op.or] = [
            { title: { [Op.iLike]: `%${search}%` } },
            { content: { [Op.iLike]: `%${search}%` } }
        ];
    }

    let include = [
        {
            model: ForumPostTopic,
            include: [
                {
                    model: Topic,
                    attributes: ['id', 'name']
                }
            ]
        },
        {
            model: User,
            as: 'creator',
            attributes: ['id', 'fullname', 'email', 'avatar']
        }
    ];
    if (topic_id) {
        include[0].where = { topic_id: topic_id };
    }

    // Sắp xếp
    let order = [
        [
            sort_by || 'createdAt',
            (sort_order && ['ASC', 'DESC'].includes(sort_order.toUpperCase()))
                ? sort_order.toUpperCase()
                : 'DESC'
        ]
    ];

    // Đếm tổng số bài viết KHÔNG dùng include để tránh sai lệch do join
    const total = await ForumPost.count({ where });

    const forumPosts = await ForumPost.findAll({
        where,
        include,
        limit,
        offset,
        order
    });

    // Lấy danh sách post_id đã lưu của user hiện tại
    let savedPostIds = [];
    if (currentUserId) {
        const savedPosts = await SavePost.findAll({
            where: { user_id: currentUserId, post_id: forumPosts.map(p => p.id) },
            attributes: ['post_id']
        });
        savedPostIds = savedPosts.map(sp => sp.post_id);
    }

    return {
        data: forumPosts.map(post => ({
            id: post.id,
            title: post.title,
            creator: post.creator,
            topics: post.ForumPostTopics?.map(fpt => fpt.Topic) || [],
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            status: post.status,
            is_saved: savedPostIds.includes(post.id)
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

const updateForumPost = async (req) => {
    const user_id = req.userId;
    const { id } = req.params;
    if (!id) throw new BadRequestError("Thiếu id bài viết!");
    let { title, content, topic_id, status } = req.body;
    if (!title || !content) throw new BadRequestError("Thiếu thông tin bắt buộc!");

    const forumPost = await ForumPost.findByPk(id);
    if (!forumPost) throw new NotFoundError("Bài viết không tồn tại!");
    if (forumPost.created_by !== user_id) throw new ForbiddenError("Bạn không có quyền sửa bài viết này!");

    if (typeof topic_id === 'string') {
        try {
            topic_id = JSON.parse(topic_id);
            if (!Array.isArray(topic_id)) throw new Error();
        } catch {
            topic_id = topic_id.split(' ').map(Number).filter(Boolean);
        }
    }
    if (!Array.isArray(topic_id)) {
        topic_id = [topic_id];
    }

    const topics = await Topic.findAll({ where: { id: topic_id } });
    if (topics.length !== topic_id.length) {
        throw new NotFoundError("Một hoặc nhiều chủ đề không tồn tại!");
    }

    // Xử lý status tương tự createForumPost
    if (forumPost.status === "approved" || forumPost.status === "needs_review" || forumPost.status === "rejected") {
        await ForumPostVersion.create({
            post_id: forumPost.id,
            title: forumPost.title,
            content: forumPost.content,
            editor_id: user_id,
        });
        forumPost.status = "needs_review";
    } else {
        let postStatus = 'pending';
        if (typeof status !== 'undefined' && status !== 'pending') {
            postStatus = 'local';
        }
        forumPost.status = postStatus;
    }

    forumPost.title = title;
    forumPost.content = content;
    await forumPost.save();

    await ForumPostTopic.destroy({ where: { forum_post_id: forumPost.id } });
    for (const tid of topic_id) {
        await ForumPostTopic.create({
            forum_post_id: forumPost.id,
            topic_id: tid
        });
    }

    if (forumPost.status === "needs_review") {
        const admins = await User.findAll({ where: { role: 'admin' } });
        const notifications = await Promise.all(
            admins.map(admin =>
                Notification.create({
                    user_id: admin.id,
                    title: "Bài viết cần duyệt lại",
                    content: `Bài viết \"${forumPost.title}\" vừa được chỉnh sửa và cần duyệt lại.`,
                    is_read: false,
                    type: 'post',
                    url: `/forum/review/${forumPost.id}`
                })
            )
        );
        if (req.io && typeof req.io.emit === "function") {
            notifications.forEach(notification => {
                req.io.emit("newNotification", notification.toJSON());
            });
        }
    }

    const forumPostDetail = await ForumPost.findByPk(forumPost.id, {
        include: [
            {
                model: ForumPostTopic,
                include: [
                    {
                        model: Topic,
                        attributes: ['id', 'name']
                    }
                ]
            }
        ]
    });

    let moderator_message = undefined;
    if (forumPost.status === "needs_review") {
        moderator_message = "Bản chỉnh sửa này đang chờ xét duyệt.";
    }

    return {
        id: forumPostDetail.id,
        title: forumPostDetail.title,
        content: forumPostDetail.content,
        created_by: forumPostDetail.created_by,
        topics: forumPostDetail.ForumPostTopics?.map(fpt => fpt.Topic) || [],
        status: forumPostDetail.status,
        moderator_message
    };
};

const deleteForumPost = async (req) => {
    const user_id = req.userId;
    const { id } = req.params;
    if (!id) throw new BadRequestError("Thiếu id bài viết!");

    const forumPost = await ForumPost.findByPk(id);
    if (!forumPost) throw new NotFoundError("Bài viết không tồn tại!");
    if (forumPost.created_by !== user_id) throw new ForbiddenError("Bạn không có quyền xóa bài viết này!");

    // Xóa các version liên quan trước
    await ForumPostVersion.destroy({ where: { post_id: id } });

    await forumPost.destroy();

    return {};
};

const cancelForumPost = async (req) => {
    const { id } = req.params;
    const user_id = req.userId;
    if (!id) throw new BadRequestError("Thiếu id bài viết!");

    const forumPost = await ForumPost.findByPk(id);
    if (!forumPost) throw new NotFoundError("Bài viết không tồn tại!");
    if (forumPost.created_by !== user_id) throw new ForbiddenError("Bạn không có quyền hủy bài viết này!");

    if (forumPost.status !== "pending") throw new BadRequestError("Bài viết không được phép được hủy!");
    forumPost.status = "local";
    await forumPost.save();

    return {};
}   

const approveForumPost = async (req) => {
    const { id } = req.params;
    if (!id) throw new BadRequestError("Thiếu id bài viết!");

    const forumPost = await ForumPost.findByPk(id);
    if (!forumPost) throw new NotFoundError("Bài viết không tồn tại!");

    if (forumPost.status !== "pending" && forumPost.status !== "needs_review") throw new BadRequestError("Bài viết không được phép được duyệt!");
    forumPost.status = "approved";
    await forumPost.save();

    // Gửi notification cho người tạo bài viết
    const notification = await Notification.create({
        user_id: forumPost.created_by,
        title: "Bài viết đã được duyệt",
        content: `Bài viết \"${forumPost.title}\" của bạn đã được duyệt!`,
        is_read: false,
        type: 'approved',
        url: `/forum/${forumPost.id}`
    });
    if (req.io && typeof req.io.emit === "function") {
        req.io.emit("newNotification", notification.toJSON());
    }

    return { notification };
};

const rejectForumPost = async (req) => {
    const { id } = req.params;
    const { reject_reason } = req.body || {};
    if (!id) throw new BadRequestError("Thiếu id bài viết!");

    const forumPost = await ForumPost.findByPk(id);
    if (!forumPost) throw new NotFoundError("Bài viết không tồn tại!");

    if (forumPost.status !== "pending" || forumPost.status !== "needs_review") throw new BadRequestError("Bài viết không được phép được duyệt!");
    forumPost.status = "rejected";
    await forumPost.save();

    // Gửi notification cho người tạo bài viết
    let content = `Bài viết \"${forumPost.title}\" của bạn đã bị từ chối!`;
    if (reject_reason) {
        content += ` Lý do: ${reject_reason}`;
    }
    const notification = await Notification.create({
        user_id: forumPost.created_by,
        title: "Bài viết bị từ chối",
        content,
        is_read: false,
        type: 'rejected',
        url: `/forum/${forumPost.id}`
    });
    if (req.io && typeof req.io.emit === "function") {
        req.io.emit("newNotification", notification.toJSON());
    }

    return { notification };
};

const inactiveForumPost = async (req) => {
    const { id } = req.params;
    const { reject_reason } = req.body || {};
    if (!id) throw new BadRequestError("Thiếu id bài viết!");

    const forumPost = await ForumPost.findByPk(id);
    if (!forumPost) throw new NotFoundError("Bài viết không tồn tại!");

    if (forumPost.status !== "approved") throw new BadRequestError("Bài viết không được phép bị vô hiệu hóa!");
    forumPost.status = "inactive";
    await forumPost.save();

    // Gửi notification cho người tạo bài viết
    let content = `Bài viết \"${forumPost.title}\" của bạn đã bị vô hiệu hóa!`;
    if (reject_reason) {
        content += ` Lý do: ${reject_reason}`;
    }
    const notification = await Notification.create({
        user_id: forumPost.created_by,
        title: "Bài viết đã bị vô hiệu hóa",
        content,
        is_read: false,
        type: 'inactive',
        url: `/forum/${forumPost.id}`
    });
    if (req.io && typeof req.io.emit === "function") {
        req.io.emit("newNotification", notification.toJSON());
    }

    return { notification };
};

const activeForumPost = async (req) => {
    const { id } = req.params;
    if (!id) throw new BadRequestError("Thiếu id bài viết!");

    const forumPost = await ForumPost.findByPk(id);
    if (!forumPost) throw new NotFoundError("Bài viết không tồn tại!");

    if (forumPost.status !== "inactive") throw new BadRequestError("Bài viết không được phép được kích hoạt!");
    forumPost.status = "approved";
    await forumPost.save();

    // Gửi notification cho người tạo bài viết
    const notification = await Notification.create({
        user_id: forumPost.created_by,
        title: "Bài viết đã được kích hoạt lại",
        content: `Bài viết \"${forumPost.title}\" của bạn đã được kích hoạt lại!`,
        is_read: false,
        type: 'approved',
        url: `/forum/${forumPost.id}`
    });
    if (req.io && typeof req.io.emit === "function") {
        req.io.emit("newNotification", notification.toJSON());
    }

    return { notification };
};



const getForumPostByToken = async (req) => {
    const user_id = req.userId;
    if (!user_id) throw new BadRequestError("Thiếu user_id bài viết!");

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { search, status, topic_id, sort_by, sort_order } = req.query;

    const where = { created_by: user_id };

    if (search) {
        where[Op.or] = [
            { title: { [Op.iLike]: `%${search}%` } },
            { content: { [Op.iLike]: `%${search}%` } }
        ];
    }

    if (status) {
        where.status = status;
    }

    let include = [
        {
            model: ForumPostTopic,
            include: [
                {
                    model: Topic,
                    attributes: ['id', 'name']
                }
            ]
        }
    ];
    if (topic_id) {
        include[0].where = { topic_id: topic_id };
    }

    const total = await ForumPost.count({ where });

    const forumPosts = await ForumPost.findAll({
        where,
        include,
        limit,
        offset,
        order: [
            [
                sort_by || 'createdAt',
                (sort_order && ['ASC', 'DESC'].includes(sort_order.toUpperCase()))
                    ? sort_order.toUpperCase()
                    : 'DESC'
            ]
        ]
    });

    const data = forumPosts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        created_by: post.created_by,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        status: post.status,
        topics: post.ForumPostTopics?.map(fpt => fpt.Topic) || []
    }));

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

const getPostById = async (req) => {
    const { id } = req.params;
    const user_id = req.userId;
    const role = req.role;
    if (!id) throw new BadRequestError("Thiếu id bài viết!");

    const forumPost = await ForumPost.findByPk(id, {
        include: [
            {
                model: ForumPostTopic,
                include: [
                    {
                        model: Topic,
                        attributes: ['id', 'name']
                    }
                ]
            },
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'fullname', 'email', 'avatar']
            }
        ]
    });
    if (!forumPost) throw new NotFoundError("Bài viết không tồn tại!");

    // Nếu là admin
    if (role === "admin") {
        if (forumPost.status === "local") {
            throw new ForbiddenError("Admin không được truy cập bài viết ở trạng thái bản nháp!");
        }
    } else if (forumPost.created_by !== user_id && forumPost.status !== "approved") {
        throw new ForbiddenError("Bạn không có quyền xem bài viết này!");
    }

    // Kiểm tra đã lưu chưa
    let is_saved = false;
    if (user_id) {
        const saved = await SavePost.findOne({ where: { user_id, post_id: id } });
        is_saved = !!saved;
    }

    // Trả về chỉ topics và creator
    return {
        id: forumPost.id,
        title: forumPost.title,
        content: forumPost.content,
        created_by: forumPost.created_by,
        createdAt: forumPost.createdAt,
        updatedAt: forumPost.updatedAt,
        status: forumPost.status,
        topics: forumPost.ForumPostTopics?.map(fpt => fpt.Topic) || [],
        creator: forumPost.creator,
        is_saved
    };
};

const submitForumPost = async (req) => {
    const { id } = req.params;
    const user_id = req.userId;
    if (!id) throw new BadRequestError("Thiếu id bài viết!");

    const forumPost = await ForumPost.findByPk(id);
    if (!forumPost) throw new NotFoundError("Bài viết không tồn tại!");
    if (forumPost.created_by !== user_id) throw new ForbiddenError("Bạn không có quyền đăng tải bài viết này!");
    if (forumPost.status !== "local") throw new BadRequestError("Bài viết không được phép được đăng tải!");
    forumPost.status = "pending";
    await forumPost.save();

    // Gửi notification cho admin khi có bài viết mới cần duyệt
    const admins = await User.findAll({ where: { role: 'admin' } });
    const notifications = await Promise.all(
        admins.map(admin =>
            Notification.create({
                user_id: admin.id,
                title: "Bài viết mới cần duyệt",
                content: `Bài viết \"${forumPost.title}\" vừa được đăng tải và cần duyệt.`,
                is_read: false,
                type: 'post',
                url: `/forum/${forumPost.id}`
            })
        )
    );
    if (req.io && typeof req.io.emit === "function") {
        notifications.forEach(notification => {
            req.io.emit("newNotification", notification.toJSON());
        });
    }

    return { notifications };
};

const getForumPostReview = async (req) => {
    const { id } = req.params;
    if (!id) throw new BadRequestError("Thiếu id bài viết!");

    // Lấy chi tiết bài viết
    const forumPost = await ForumPost.findByPk(id, {
        include: [
            {
                model: ForumPostTopic,
                include: [
                    {
                        model: Topic,
                        attributes: ['id', 'name']
                    }
                ]
            },
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'fullname', 'email', 'avatar']
            }
        ]
    });
    if (!forumPost) throw new NotFoundError("Bài viết không tồn tại!");

    // Lấy các phiên bản bài viết
    const version = await ForumPostVersion.findOne({
        where: { post_id: id },
    });

    return {
        forumPost: {
            id: forumPost.id,
            title: forumPost.title,
            content: forumPost.content,
            created_by: forumPost.created_by,
            createdAt: forumPost.createdAt,
            updatedAt: forumPost.updatedAt,
            status: forumPost.status,
            topics: forumPost.ForumPostTopics?.map(fpt => fpt.Topic) || [],
            creator: forumPost.creator
        },
        version: {
            id: version.id,
            post_id: version.post_id,
            title: version.title,
            content: version.content,
            createdAt: version.createdAt,
            updatedAt: version.updatedAt,
        }
    };
};

const saveForumPost = async (req) => {
    const user_id = req.userId;
    const { id } = req.params;
    if (!id) throw new BadRequestError("Thiếu id bài viết!");

    const forumPost = await ForumPost.findByPk(id);
    if (!forumPost) throw new NotFoundError("Bài viết không tồn tại!");

    const existed = await SavePost.findOne({ where: { user_id, post_id: id } });
    if (existed) throw new BadRequestError("Bài viết đã được lưu trước đó!");

    await SavePost.create({ user_id, post_id: id });
    return {};
}

const getSavedForumPost = async (req) => {
    const user_id = req.userId;
    if (!user_id) throw new BadRequestError("Thiếu user_id!");

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const { search, topic_id } = req.query;

    // Xây dựng include cho topics và creator
    let forumPostInclude = [
        {
            model: ForumPostTopic,
            include: [
                {
                    model: Topic,
                    attributes: ['id', 'name']
                }
            ]
        },
        {
            model: User,
            as: 'creator',
            attributes: ['id', 'fullname', 'email', 'avatar']
        }
    ];
    if (topic_id) {
        forumPostInclude[0].where = { topic_id };
    }

    // Xây dựng where cho search
    let forumPostWhere = {};
    if (search) {
        forumPostWhere = {
            ...forumPostWhere,
            [Op.or]: [
                { title: { [Op.iLike]: `%${search}%` } },
                { content: { [Op.iLike]: `%${search}%` } }
            ]
        };
    }

    // Order mặc định theo ngày lưu (SavePost.createdAt DESC)
    let order = [['createdAt', 'DESC']];

    const { count: total, rows: savedPosts } = await SavePost.findAndCountAll({
        where: { user_id },
        include: [{
            model: ForumPost,
            attributes: ['id', 'title', 'status', 'createdAt', 'content', 'created_by'],
            where: forumPostWhere,
            include: forumPostInclude
        }],
        limit,
        offset,
        order,
    });
    return {
        data: savedPosts.map(sp => ({
            id: sp.id,
            post_id: sp.post_id,
            createdAt: sp.createdAt,
            post: sp.ForumPost ? {
                id: sp.ForumPost.id,
                title: sp.ForumPost.title,
                status: sp.ForumPost.status,
                createdAt: sp.ForumPost.createdAt,
                content: sp.ForumPost.content,
                creator: sp.ForumPost.creator,
                topics: sp.ForumPost.ForumPostTopics?.map(fpt => fpt.Topic) || []
            } : null
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

const deleteSavedForumPost = async (req) => {
    const user_id = req.userId;
    const { id } = req.params;
    if (!id) throw new BadRequestError("Thiếu id bài viết!");

    const savedPost = await SavePost.findOne({ where: { user_id, post_id: id } });
    if (!savedPost) throw new NotFoundError("Bài viết không tồn tại trong danh sách lưu!");
    if (savedPost.user_id !== user_id) throw new ForbiddenError("Bạn không có quyền xóa bài viết này!");
    await savedPost.destroy();
    return {};
}

export const forumPostService = {
    createForumPost,
    getForumPosts,
    updateForumPost,
    deleteForumPost,
    cancelForumPost,
    approveForumPost,
    rejectForumPost,
    inactiveForumPost,
    activeForumPost,
    getApprovedForumPosts,
    getForumPostByToken,
    getPostById,
    submitForumPost,
    getForumPostReview,
    saveForumPost,
    getSavedForumPost,
    deleteSavedForumPost
};
