import express from "express";
import { Auth } from "../middlewares/Auth.js";
import { topicController } from "../controllers/topicController.js";

const router = express.Router();

router.route("/").get(Auth.UserAuth, topicController.getTopic);

export default router;


