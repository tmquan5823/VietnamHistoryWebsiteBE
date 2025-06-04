import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'images',
      format: 'jpg',
    };
  },
});

const upload = multer({ storage: storage });

// Middleware cho phép upload 2 ảnh: 'original' và 'restored'
const uploadTwoImages = upload.fields([
  { name: 'original', maxCount: 1 },
  { name: 'restored', maxCount: 1 }
]);

export default uploadTwoImages;
