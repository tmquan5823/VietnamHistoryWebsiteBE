import Image from "../models/images.model.js";
import NotFoundError from "../errors/NotFoundError.js";
import { v2 as cloudinary } from 'cloudinary';

const getImagesByToken = async (req, res) => {
    const userId = req.userId;
    // Lấy sort từ query, mặc định là 'desc'
    const sort = req.query.sort === 'asc' ? 'ASC' : 'DESC';
    const images = await Image.findAll({
        where: { user_id: userId },
        order: [['createdAt', sort]]
    });
    return images;
};

const getImageById = async (req, res) => {
    const { id } = req.params;
    const image = await Image.findByPk(id);
    return image;
};

const saveImage = async (req, res) => {
        const userId = req.userId;

        const originalFile = req.files.original?.[0];
        const restoredFile = req.files.restored?.[0];

        if (!originalFile || !restoredFile) {
            return res.status(400).json({ message: 'Thiếu ảnh original hoặc restored' });
        }

        const image = await Image.create({
            user_id: userId,
            original: originalFile.path,      // URL ảnh gốc
            original_id: originalFile.filename, // public_id để xóa
            restored: restoredFile.path,      // URL ảnh phục chế
            restored_id: restoredFile.filename // public_id để xóa
        });

        return image;
};

const getPublicId = (filename) => filename.replace(/\\.jpg$/i, '');

const deleteImage = async (req, res) => {
    const { id } = req.params;
    const image = await Image.findByPk(id);
    if (!image) {
        throw new NotFoundError("Không tìm thấy ảnh");
    }

    console.log('Xóa Cloudinary:', image.original_id, image.restored_id);

    const destroyOriginal = image.original_id
        ? cloudinary.uploader.destroy(getPublicId(image.original_id)).then(r => {console.log('Xóa original:', r); return r;})
        : Promise.resolve();
    const destroyRestored = image.restored_id
        ? cloudinary.uploader.destroy(getPublicId(image.restored_id)).then(r => {console.log('Xóa restored:', r); return r;})
        : Promise.resolve();

    await Promise.all([destroyOriginal, destroyRestored]);
    await image.destroy();

    return {};
};

export const imagesService = {
    getImagesByToken,
    getImageById,
    saveImage,
    deleteImage
};


