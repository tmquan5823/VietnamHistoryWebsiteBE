import { StatusCodes } from "http-status-codes";
import { quizService } from "../services/quizService.js";
import { quizQuestionService } from "../services/quizQuestionService.js";

const getQuizSet = async (req, res, next) => {
    try {
        const result = await quizService.getQuizSet(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy danh sách bộ câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const getPublishedQuizSet = async (req, res, next) => {
    try {
        const result = await quizService.getPublishedQuizSet(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy danh sách bộ câu hỏi đã xuất bản thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const getQuizSetByToken = async (req, res, next) => {
    try {
        const result = await quizService.getQuizSetByToken(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy danh sách bộ câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const getPublishQuizSet = async (req, res, next) => {
    try {
        const result = await quizService.getPublishQuizSet(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy danh sách bộ câu hỏi đã xuất bản thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};


const createQuizSet = async (req, res, next) => {
    try {
        // Lấy url ảnh từ file upload
        const imageUrl = req.file?.path; // hoặc req.file?.url
        // Gộp vào body để truyền xuống service
        const data = {
            ...req.body,
            image: imageUrl
        };
        const quizSet = await quizService.createQuizSet({ body: data });
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Tạo bộ câu hỏi thành công!",
            data: quizSet
        });
    } catch(err){
        next(err);
    }
};

const getQuizSetById = async (req, res, next) => {
    try {
        const result = await quizService.getQuizSetById(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy bộ câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const updateQuizSet = async (req, res, next) => {
    try {
        // Nếu có file upload, gán lại image vào req.body
        if (req.file?.path) {
            req.body.image = req.file.path;
        }
        const result = await quizService.updateQuizSet(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Cập nhật bộ câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const deleteQuizSet = async (req, res, next) => {
    try {
        const result = await quizService.deleteQuizSet(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Xóa bộ câu hỏi thành công!",
            data: result    
        });
    } catch(err){
        next(err);
    }
};

// User gửi duyệt quiz set
const submitQuizSetForApproval = async (req, res, next) => {
    try {
        const result = await quizService.submitQuizSetForApproval(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Gửi duyệt bộ câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

// Admin phê duyệt quiz set
const approveQuizSet = async (req, res, next) => {
    try {
        const result = await quizService.approveQuizSet(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Phê duyệt bộ câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

// Admin từ chối quiz set
const rejectQuizSet = async (req, res, next) => {
    try {
        const result = await quizService.rejectQuizSet(req);
        // Gửi thông báo socket
        req.io.emit("newNotification", {
            title: "Quiz bị từ chối",
            content: `Quiz \"${result.title}\" đã bị admin từ chối. Lý do: ${req.body.reject_reason || "Không rõ"}`,
            createdAt: new Date()
        });
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Từ chối bộ câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

// Hủy publish quiz set (user hoặc admin)
const unpublishQuizSet = async (req, res, next) => {
    try {
        const result = await quizService.unpublishQuizSet(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Hủy publish bộ câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const inactivePublishQuizSet = async (req, res, next) => {
    try {
        const result = await quizService.inactivePublishQuizSet(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Hủy publish bộ câu hỏi thành công!",  
            data: result
        });
    } catch(err){
        next(err);
    }
};

const publishQuizSet = async (req, res, next) => {
    try {
        const result = await quizService.publishQuizSet(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Publish bộ câu hỏi thành công!",
            data: result    
        });
    } catch(err){
        next(err);
    }
};

const createQuizSetWithQuestions = async (req, res, next) => {
    try {
        const result = await quizService.createQuizSetWithQuestions(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Tạo bộ câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const getQuizSetWithQuestions = async (req, res, next) => {
    try {
        const result = await quizService.getQuizSetWithQuestions(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy bộ câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const getQuizSetWithQuestionsForPlay = async (req, res, next) => {
    try {
        const result = await quizService.getQuizSetWithQuestionsForPlay(req);
        return res.status(StatusCodes.OK).json({
            status: "success", 
            message: "Lấy bộ câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}



const updateQuizSetWithQuestions = async (req, res, next) => {
    try {
        const result = await quizService.updateQuizSetWithQuestions(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Cập nhật bộ câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const getQuizResults = async (req, res, next) => {
    try {
        const result = await quizService.getQuizResults(req);
        return res.status(StatusCodes.OK).json({
            status: "success",  
            message: "Lấy kết quả thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const getQuizLeaderboard = async (req, res, next) => {
    try {
        const result = await quizService.getQuizLeaderboard(req);
        return res.status(StatusCodes.OK).json({
            status: "success",  
            message: "Lấy bảng xếp hạng thành công!",
            data: result
        });
    } catch(err) {
        next(err);
    }
}

export const quizController = {
    createQuizSet,
    getPublishedQuizSet,
    getQuizSetById,
    getQuizSet,
    updateQuizSet,
    deleteQuizSet,
    submitQuizSetForApproval,
    approveQuizSet,
    rejectQuizSet,
    unpublishQuizSet,
    inactivePublishQuizSet,
    publishQuizSet,
    getPublishQuizSet,
    getQuizSetByToken,
    createQuizSetWithQuestions,
    getQuizSetWithQuestions,
    updateQuizSetWithQuestions,
    getQuizSetWithQuestionsForPlay,
    getQuizResults,
    getQuizLeaderboard,
};