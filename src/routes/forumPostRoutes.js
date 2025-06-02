import express from "express";

import {Auth} from "../middlewares/Auth.js";
import { forumPostController } from "../controllers/forumPostController.js";
const router = express.Router();

router.route("/").post(Auth.UserAuth, forumPostController.createForumPost);
router.route("/").get(Auth.AdminAuth, forumPostController.getForumPosts);
router.route("/approved").get(Auth.UserAuth, forumPostController.getApprovedForumPosts);
router.route("/getByToken").get(Auth.UserAuth, forumPostController.getForumPostByToken);
router.route("/save").get(Auth.UserAuth, forumPostController.getSavedForumPost);
router.route("/save/:id").post(Auth.UserAuth, forumPostController.saveForumPost);
router.route("/save/:id").delete(Auth.UserAuth, forumPostController.deleteSavedForumPost);
router.route("/:id").get(Auth.UserAuth, forumPostController.getPostById);
router.route("/:id").put(Auth.UserAuth, forumPostController.updateForumPost);
router.route("/:id").delete(Auth.UserAuth, forumPostController.deleteForumPost);
router.route("/:id/approve").put(Auth.UserAuth, forumPostController.approveForumPost);
router.route("/:id/reject").put(Auth.UserAuth, forumPostController.rejectForumPost);
router.route("/:id/inactive").put(Auth.UserAuth, forumPostController.inactiveForumPost);
router.route("/:id/active").put(Auth.UserAuth, forumPostController.activeForumPost);
router.route("/:id/cancel").put(Auth.UserAuth, forumPostController.cancelForumPost);
router.route("/:id/submit").put(Auth.UserAuth, forumPostController.submitForumPost);
router.route("/:id/review").get(Auth.UserAuth, forumPostController.getForumPostReview);



export default router;
