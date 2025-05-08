import express from "express";
import {
    periodsController
} from "../controllers/periodsController.js";
import {Auth} from "../middlewares/Auth.js";

const router = express.Router();

router.route("/").get(periodsController.getPeriods);
router.route("/").post(Auth.AdminAuth, periodsController.createPeriod);
export default router;
