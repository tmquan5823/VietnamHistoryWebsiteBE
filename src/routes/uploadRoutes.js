import { Auth } from "../middlewares/Auth.js";
import avatarUpload from "../middlewares/avatarUpload.js";
import express from "express";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

router.post("/", Auth.UserAuth, avatarUpload.single("image"), (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  return res.json({
    success: true,
    url: req.file.path,
    public_id: req.file.filename
  });
});

router.delete("/", Auth.UserAuth, (req, res) => {
  const { public_id } = req.body;
  cloudinary.uploader.destroy(public_id, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    return res.json({ success: true, message: "Image deleted successfully" });
  });
});
export default router;
