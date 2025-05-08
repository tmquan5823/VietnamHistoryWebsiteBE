import express from "express";
import {
    historyDocumentController
} from "../controllers/historyDocumentController.js";
import { authValidation } from "../validations/authValidation.js";
import {Auth} from "../middlewares/Auth.js";

const router = express.Router();

router.route("/").get(historyDocumentController.getDocuments);
router.route("/title").get(historyDocumentController.getDocumentsTitle);
router.route("/").post(Auth.AdminAuth, historyDocumentController.createDocument);
router.route("/:id").put(Auth.AdminAuth, historyDocumentController.updateDocument);
router.route("/:id").delete(Auth.AdminAuth, historyDocumentController.deleteDocument);
router.route("/:id").get(historyDocumentController.getDocumentById);

export default router;
