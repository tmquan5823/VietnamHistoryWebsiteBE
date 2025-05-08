import { StatusCodes } from "http-status-codes";
import { historyDocumentService } from "../services/historyDocumentService.js";

//Sign up
const createDocument = async (req, res, next) => {
    try {
        const result = await historyDocumentService.createDocument(req);
        console.log(result);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Tạo tài liệu thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const getDocuments = async (req, res, next) => {
    try {
        const result = await historyDocumentService.getDocuments(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy danh sách tài liệu thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const getDocumentById = async (req, res, next) => {
    try {
        const result = await historyDocumentService.getDocumentById(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy tài liệu thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}   

const getDocumentsTitle = async (req, res, next) => {
    try {
        const result = await historyDocumentService.getDocumentsTitle(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy danh sách tên tài liệu thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const updateDocument = async (req, res, next) => {
    try {
        const result = await historyDocumentService.updateDocument(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Cập nhật tài liệu thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}
const deleteDocument = async (req, res, next) => {
    try {
        const result = await historyDocumentService.deleteDocument(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Xóa tài liệu thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

export const historyDocumentController = {
    createDocument,
    getDocuments,
    getDocumentById,
    getDocumentsTitle,
    updateDocument,
    deleteDocument,
};