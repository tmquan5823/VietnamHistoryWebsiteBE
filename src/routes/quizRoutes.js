import express from "express";
import {
    quizController
} from "../controllers/quizController.js";
import {Auth} from "../middlewares/Auth.js";
import avatarUpload from "../middlewares/avatarUpload.js";
import { quizQuestionController } from "../controllers/quizQuestionController.js";
const router = express.Router();

router.route("/").get(Auth.AdminAuth, quizController.getQuizSet);
router.route("/published").get(Auth.UserAuth, quizController.getPublishedQuizSet);
router.route("/getByToken").get(Auth.UserAuth, quizController.getQuizSetByToken);
router.route("/publish").get(Auth.UserAuth, quizController.getPublishQuizSet);
router.route("/").post(Auth.UserAuth, avatarUpload.single("image"), quizController.createQuizSet);
router.route("/quizSetWithQuestionsForPlay/:id").get(Auth.UserAuth, quizController.getQuizSetWithQuestionsForPlay);
router.route("/quizSetWithQuestions/:id").get(Auth.UserAuth, quizController.getQuizSetWithQuestions);
router.route("/quizSetWithQuestions").post(Auth.UserAuth, quizController.createQuizSetWithQuestions);
router.route("/quizSetWithQuestions").put(Auth.UserAuth, quizController.updateQuizSetWithQuestions);
router.route("/:id").get(Auth.UserAuth, quizController.getQuizSetById);
router.route("/:id").put(Auth.UserAuth, avatarUpload.single("image"), quizController.updateQuizSet);
router.route("/:id").delete(Auth.UserAuth, quizController.deleteQuizSet);

// User gửi duyệt quiz set
router.route("/:id/submit-approval").put(Auth.UserAuth, quizController.submitQuizSetForApproval);
// Admin phê duyệt quiz set
router.route("/:id/approve").put(Auth.AdminAuth, quizController.approveQuizSet);
// Admin từ chối quiz set
router.route("/:id/reject").put(Auth.AdminAuth, quizController.rejectQuizSet);
// Hủy publish quiz set (user hoặc admin)
router.route("/:id/unpublish").put(Auth.UserAuth, quizController.unpublishQuizSet);
// Hủy publish quiz set (admin)
router.route("/:id/inactive").put(Auth.AdminAuth, quizController.inactivePublishQuizSet);
// Publish quiz set (admin)
router.route("/:id/publish").put(Auth.AdminAuth, quizController.publishQuizSet);


router.route("/:id/questions").get(Auth.UserAuth, quizQuestionController.getQuizQuestionByQuizSetId);
router.route("/:id/questions").post(Auth.UserAuth, quizQuestionController.createQuizQuestion);
router.route("/:id/questions/:question_id").get(Auth.UserAuth, quizQuestionController.getQuizQuestionById);
router.route("/:id/questions").put(Auth.UserAuth, quizQuestionController.updateQuizQuestions);
router.route("/:id/questions/submit").post(Auth.UserAuth, quizQuestionController.quizQuestionSubmit);

router.route("/:id/results").get(Auth.UserAuth,quizController.getQuizResults);
router.route("/:id/leaderboard").get(Auth.UserAuth,quizController.getQuizLeaderboard);


export default router;
