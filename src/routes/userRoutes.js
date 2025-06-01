import express from "express";
import {
    userController
} from "../controllers/userController.js";
import {Auth} from "../middlewares/Auth.js";
import  upload  from "../middlewares/avatarUpload.js";

const router = express.Router();

router.route("/").get(Auth.AdminAuth, userController.getAllUsers);
router.route("/").post(Auth.AdminAuth, upload.single("avatar"), userController.createUser);
router.route("/:id").get(Auth.AdminAuth, userController.getUserById);
router.route("/role").put(Auth.AdminAuth, userController.updateUserRole);
router.route("/ban/:id").put(Auth.AdminAuth, userController.banUser);
router.route("/unban/:id").put(Auth.AdminAuth, userController.unBanUser);
router.route("/:id").put(Auth.AdminAuth, upload.single("avatar"), userController.updateUser);
export default router;
