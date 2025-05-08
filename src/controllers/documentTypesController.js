import { StatusCodes } from "http-status-codes";
import { documentTypesService } from "../services/documentTypesService.js";
//Sign up
const getDocumentTypes = async (req, res, next) => {
    try {
        const result = await documentTypesService.getDocumentTypes(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy danh sách loại tài liệu thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};
    
const createDocumentType = async (req, res, next) => {
    try {
        const result = await documentTypesService.createDocumentType(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Tạo loại tài liệu thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};


export const documentTypesController = {
    getDocumentTypes,
    createDocumentType
};