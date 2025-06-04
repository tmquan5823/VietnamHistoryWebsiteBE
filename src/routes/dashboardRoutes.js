import express from "express";
import {
    dashboardController
} from "../controllers/dashboardController.js";
import {Auth} from "../middlewares/Auth.js";

const router = express.Router();

router.route("/").get(Auth.AdminAuth, dashboardController.getDashboardData);
router.route("/homepage").get(dashboardController.getHomePageData);

export default router;
