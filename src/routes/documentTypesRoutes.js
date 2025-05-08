import express from "express";
import {
    documentTypesController
} from "../controllers/documentTypesController.js";
import {Auth} from "../middlewares/Auth.js";

const router = express.Router();

router.route("/").get(documentTypesController.getDocumentTypes);
router.route("/").post(Auth.AdminAuth, documentTypesController.createDocumentType);
export default router;
