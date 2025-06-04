import express from "express";
import {
    imagesController
} from "../controllers/imagesController.js";
import {Auth} from "../middlewares/Auth.js";
import uploadTwoImages from "../middlewares/imageUpload.js";

const router = express.Router();

router.route("/").get(Auth.UserAuth, imagesController.getImagesByToken);
router.route("/").post(Auth.UserAuth, uploadTwoImages, imagesController.saveImage);
router.route("/:id").get(Auth.UserAuth, imagesController.getImageById);
router.route("/:id").delete(Auth.UserAuth, imagesController.deleteImage);

export default router;
