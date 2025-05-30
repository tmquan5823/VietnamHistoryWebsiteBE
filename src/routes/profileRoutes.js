import express from "express";
import {
    profileController
} from "../controllers/prifileController.js";
import {Auth} from "../middlewares/Auth.js";
import avatarUpload from "../middlewares/avatarUpload.js";

const router = express.Router();

router.route("/").get(Auth.UserAuth, profileController.getProfile);
router.route("/").put(Auth.UserAuth, avatarUpload.single("avatar"), profileController.updateProfile);
router.route("/change-password").put(Auth.UserAuth, profileController.changePassword);


export default router;
