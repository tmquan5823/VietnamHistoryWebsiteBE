import Topic from "../models/topic.model.js";

const getTopic = async (req) => {
    const { page, limit } = req.query;
    if (!page || !limit) {
        // Nếu không truyền page hoặc limit thì trả về toàn bộ
        return await Topic.findAll();
    }
    const topics = await Topic.findAll()
        .skip((page - 1) * limit)
        .limit(limit);
    return topics;
}

export const topicService = {
    getTopic
}
