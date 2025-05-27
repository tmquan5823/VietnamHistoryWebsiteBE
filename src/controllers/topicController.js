import { StatusCodes } from "http-status-codes";
import { topicService } from "../services/topicService.js";

const getTopic = async (req, res, next) => {
    try {
        const result = await topicService.getTopic(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy danh sách chủ đề thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

export const topicController = {
    getTopic
}
