import { StatusCodes } from "http-status-codes";
import { quizQuestionService } from "../services/quizQuestionService.js";

const createQuizQuestion = async (req, res, next) => {
    try {
        const result = await quizQuestionService.createQuizQuestion({ params: req.params, body: req.body });
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Tạo câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const getQuizQuestionById = async (req, res, next) => {
    try {
        const result = await quizQuestionService.getQuizQuestionById(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const updateQuizQuestions = async (req, res, next) => {
    try {
        const result = await quizQuestionService.updateQuizQuestions(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Cập nhật câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const getQuizQuestionByQuizSetId = async (req, res, next) => {
    try {
        const result = await quizQuestionService.getQuizQuestionByQuizSetId(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const quizQuestionSubmit = async (req, res, next) => {
    try {
        const result = await quizQuestionService.quizQuestionSubmit(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Gửi câu hỏi thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

export const quizQuestionController = {
    createQuizQuestion,
    getQuizQuestionById,
    updateQuizQuestions,
    getQuizQuestionByQuizSetId,
    quizQuestionSubmit
};