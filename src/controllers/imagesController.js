import { StatusCodes } from "http-status-codes";
import { imagesService } from "../services/imagesService.js";

const getImagesByToken = async (req, res, next) => {
    try {
        const result = await imagesService.getImagesByToken(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy dữ liệu ảnh thành công!",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const saveImage = async (req, res, next) => {
    try {
        const result = await imagesService.saveImage(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lưu ảnh thành công!",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getImageById = async (req, res, next) => {
    try {
        const result = await imagesService.getImageById(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy dữ liệu ảnh thành công!",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const deleteImage = async (req, res, next) => {
    try {
        const result = await imagesService.deleteImage(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Xóa ảnh thành công!",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const imagesController = {
    getImagesByToken,
    saveImage,
    getImageById,
    deleteImage
};

