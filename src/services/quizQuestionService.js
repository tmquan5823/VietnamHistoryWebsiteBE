import QuizQuestion from "../models/quizQuestion.model.js";
import dotenv from "dotenv";
import QuizSet from "../models/quizSet.model.js";
import NotFoundError from "../errors/NotFoundError.js";
import BadRequestError from "../errors/BadRequestError.js";
import QuizHistory from "../models/quizHistory.model.js";
import QuizLeaderboard from "../models/quizLeaderboard.model.js";
import ForbiddenError from "../errors/ForbiddenError.js";
import { Op } from "sequelize";

dotenv.config();

const createQuizQuestion = async (data) => {
    const { id } = data.params; 
    let { questions } = data.body;
    const quiz = await QuizSet.findByPk(id);
    if (!quiz) {
        throw new NotFoundError("Không tìm thấy bộ câu hỏi");
    }
    if(!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new BadRequestError("Không có câu hỏi");
    }
    questions = questions.map(q => ({
        ...q,
        quiz_id: id,
        action: q.action || 'created'
    }));
    const quizQuestions = await QuizQuestion.bulkCreate(questions);
    return quizQuestions;
};

const updateQuizQuestions = async (data) => {
    const { id } = data.params; // quizSet id
    const { questions } = data.body;
    const user_id = data.userId;
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new BadRequestError("Không có câu hỏi");
    }
    const quiz = await QuizSet.findByPk(id);
    if (!quiz) {    
        throw new NotFoundError("Không tìm thấy bộ câu hỏi");
    }
    if(user_id !== quiz.created_by){
        throw new ForbiddenError("Bạn không có quyền truy cập vào bộ câu hỏi này này");
    }
    for (const q of questions) {
        if (q.action === 'created') {
            await QuizQuestion.create({
                ...q,
                quiz_id: id
            });
        } else if (q.action === 'updated') {
            const { id: questionId, ...updateFields } = q;
            await QuizQuestion.update(
                { ...updateFields },
                { where: { id: questionId, quiz_id: id } }
            );
        } else if (q.action === 'deleted') {
            await QuizQuestion.destroy({ where: { id: q.id, quiz_id: id } });
        }
    }

    // Trả về danh sách câu hỏi mới nhất
    const quizQuestions = await QuizQuestion.findAll({ where: { quiz_id: id } });
    return quizQuestions;
};

const getQuizQuestionById = async (data) => {
    const { id, question_id } = data.params;
    if(!id || !question_id) {
        throw new BadRequestError("Thiếu id hoặc question_id");
    }
    const user_id = data.userId;
    const quiz = await QuizSet.findByPk(id);
    if (user_id !== quiz.created_by && quiz.status !== 'publish') {
        throw new ForbiddenError("Bạn không có quyền truy cập vào bộ câu hỏi này");
    }

    const quizQuestion = await QuizQuestion.findOne({
        where: { quiz_id: id, id: question_id },
        attributes: ['id', 'quiz_id', 'content', 'type', 'number', 'answers'],
    });

    if (!quizQuestion) {
        throw new NotFoundError("Không tìm thấy câu hỏi");
    }

    return quizQuestion;
};

const quizQuestionSubmit = async (data) => {
    const { id } = data.params; // id là quiz_set_id
    const role = data.role;
    const { number, answer, score: userScore, time_taken, is_multi_answer, is_end_time } = data.body;
    const user_id = data.userId;
    if (!user_id) throw new BadRequestError("Thiếu thông tin người dùng");
    if (typeof number === 'undefined') throw new BadRequestError("Thiếu số thứ tự câu hỏi");

    // Lấy câu hỏi theo quiz_set_id và number
    const q = await QuizQuestion.findOne({ where: { quiz_id: id, number } });
    if (!q) throw new NotFoundError("Không tìm thấy câu hỏi");
    const quiz_set_id = q.quiz_id;
    const question_id = q.id;

    // Lấy thông tin quiz set để kiểm tra creator
    const quiz = await QuizSet.findByPk(quiz_set_id);
    if (!quiz) throw new NotFoundError("Không tìm thấy bộ câu hỏi");
    if (user_id === quiz.created_by || role === 'admin') {
        // Chỉ trả về kết quả, không lưu lịch sử, không cập nhật leaderboard
        let is_correct = false;
        let score = 0;
        let correctArr = [];
        try {
            correctArr = JSON.parse(q.correct_answers || '[]');
        } catch {
            correctArr = [];
        }
        // So sánh đáp án
        if (q.question_type === 'text') {
            if (Array.isArray(answer) && answer.length === 1) {
                const userAns = String(answer[0]).trim().toLowerCase();
                is_correct = correctArr.some(
                    (c) => String(c).trim().toLowerCase() === userAns
                );
            }
        } else if (q.question_type === 'single_choice') {
            is_correct = Array.isArray(answer) && answer.length === 1 && answer[0] === correctArr[0];
        } else if (q.question_type === 'multi_choice') {
            if (Array.isArray(answer)) {
                const sortA = [...answer].sort();
                const sortB = [...correctArr].sort();
                is_correct =
                    sortA.length === sortB.length &&
                    sortA.every((val, idx) => val === sortB[idx]);
            }
        } else if (q.question_type === 'range') {
            if (Array.isArray(answer)) {
                const sortA = [...answer].map(Number).sort((a, b) => a - b);
                const sortB = [...correctArr].map(Number).sort((a, b) => a - b);
                is_correct =
                    sortA.length === sortB.length &&
                    sortA.every((val, idx) => val === sortB[idx]);
            }
        } else {
            throw new BadRequestError("Loại câu hỏi không hỗ trợ");
        }
        // Tính điểm
        if (is_correct) {
            const max_score = q.max_score || 1000;
            const time_limit = q.time_limit_seconds || 30;
            if (typeof time_taken === 'number') {
                if (time_taken > time_limit) {
                    score = 0;
                } else {
                    score = Math.round(max_score * (1 - (time_taken / time_limit)));
                    if (score < 0) score = 0;
                }
            } else if (typeof userScore === 'number') {
                score = userScore;
            } else {
                score = max_score;
            }
        }
        const shouldShowAnswer = !is_multi_answer || is_correct || is_end_time;
        const correct_answer = shouldShowAnswer ? correctArr : [];
        const funfact = shouldShowAnswer ? (q.funfact || "") : "";
        return { is_correct, score, correct_answer, funfact, is_first: false };
    }

    // Kiểm tra đã có lịch sử chưa
    const existed = await QuizHistory.findOne({
        where: { user_id, quiz_set_id, question_id }
    });

    if (typeof answer === 'undefined' || answer === null || answer === '') {
        throw new BadRequestError("Thiếu đáp án");
    }
    if (typeof time_taken !== 'undefined' && (isNaN(time_taken) || time_taken < 0)) {
        throw new BadRequestError("Thời gian trả lời không hợp lệ");
    }

    let is_correct = false;
    let score = 0;
    let correctArr = [];
    try {
        correctArr = JSON.parse(q.correct_answers || '[]');
    } catch {
        correctArr = [];
    }

    // So sánh đáp án
    if (q.question_type === 'text') {
        if (Array.isArray(answer) && answer.length === 1) {
            const userAns = String(answer[0]).trim().toLowerCase();
            is_correct = correctArr.some(
                (c) => String(c).trim().toLowerCase() === userAns
            );
        }
    } else if (q.question_type === 'single_choice') {
        is_correct = Array.isArray(answer) && answer.length === 1 && answer[0] === correctArr[0];
    } else if (q.question_type === 'multi_choice') {
        if (Array.isArray(answer)) {
            const sortA = [...answer].sort();
            const sortB = [...correctArr].sort();
            is_correct =
                sortA.length === sortB.length &&
                sortA.every((val, idx) => val === sortB[idx]);
        }
    } else if (q.question_type === 'range') {
        if (Array.isArray(answer)) {
            const sortA = [...answer].map(Number).sort((a, b) => a - b);
            const sortB = [...correctArr].map(Number).sort((a, b) => a - b);
            is_correct =
                sortA.length === sortB.length &&
                sortA.every((val, idx) => val === sortB[idx]);
        }
    } else {
        throw new BadRequestError("Loại câu hỏi không hỗ trợ");
    }

    // Tính điểm
    if (is_correct) {
        const max_score = q.max_score || 1000;
        const time_limit = q.time_limit_seconds || 30;
        if (typeof time_taken === 'number') {
            if (time_taken > time_limit) {
                score = 0;
            } else {
                score = Math.round(max_score * (1 - (time_taken / time_limit)));
                if (score < 0) score = 0;
            }
        } else if (typeof userScore === 'number') {
            score = userScore;
        } else {
            score = max_score;
        }
    }

    // Xác định khi nào trả về đáp án đúng và funfact
    const shouldShowAnswer = !is_multi_answer || is_correct || is_end_time;
    const correct_answer = shouldShowAnswer ? correctArr : [];
    const funfact = shouldShowAnswer ? (q.funfact || "") : "";

    if (!existed) {
        // Lưu lịch sử lần đầu
        await QuizHistory.create({
            user_id,
            quiz_set_id,
            question_id,
            user_answer: JSON.stringify(answer),
            is_correct,
            score: Math.round(score),
            time_taken: typeof time_taken === 'number' ? time_taken : null
        });

        // Cập nhật leaderboard
        const lb = await QuizLeaderboard.findOne({ where: { quiz_id: quiz_set_id, user_id } });
        if (!lb) {
            await QuizLeaderboard.create({
                quiz_id: quiz_set_id,
                user_id,
                score: Math.round(score),
                is_finished: false
            });
        } else {
            lb.score = (lb.score || 0) + Math.round(score);
            await lb.save();
        }

        // Kiểm tra hoàn thành quiz (không tính info)
        const totalQuestions = await QuizQuestion.count({
            where: {
                quiz_id: quiz_set_id,
                question_type: { [Op.not]: 'info' }
            }
        });
        // Lấy tất cả history của user cho quiz này
        const userHistories = await QuizHistory.findAll({
            where: { quiz_set_id, user_id }
        });
        // Lấy danh sách question_id của các câu hỏi info
        const infoQuestions = await QuizQuestion.findAll({
            where: { quiz_id: quiz_set_id, question_type: 'info' }
        });
        const infoQuestionIds = infoQuestions.map(q => q.id);
        // Đếm số câu hỏi đã trả lời không phải info
        const userAnsweredCount = userHistories.filter(h => !infoQuestionIds.includes(h.question_id)).length;

        if (userAnsweredCount >= totalQuestions) {
            const lb2 = await QuizLeaderboard.findOne({ where: { quiz_id: quiz_set_id, user_id } });
            if (lb2 && !lb2.is_finished) {
                lb2.is_finished = true;
                lb2.finished_at = new Date();
                await lb2.save();
            }
        }
    }

    return { is_correct, score, correct_answer, funfact, is_first: !existed };
};

const getQuizQuestionByQuizSetId = async (data) => {
    const { id } = data.params;
    const user_id = data.userId;
    const quiz = await QuizSet.findByPk(id);
    if(user_id !== quiz.created_by && quiz.status !== 'publish'){
        throw new ForbiddenError("Bạn không có quyền truy cập vào bộ câu hỏi này này");
    }
    const quizQuestion = await QuizQuestion.findAll({
        where: { quiz_id: id },
        attributes: {
            exclude: ['correct_answers', 'expected_answer', 'status', 'createdAt', 'funfact']
        },
        order: [['number', 'ASC']]
    });
    return quizQuestion;
};

export const quizQuestionService = {
    createQuizQuestion,
    getQuizQuestionById,
    updateQuizQuestions,
    quizQuestionSubmit,
    getQuizQuestionByQuizSetId
};