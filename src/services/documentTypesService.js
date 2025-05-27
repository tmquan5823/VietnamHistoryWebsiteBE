import DocumentType from "../models/documentType.model.js";
import dotenv from "dotenv";

dotenv.config();

const getDocumentTypes = async (data) => {
    const documentTypes = await DocumentType.findAll({
        order: [['id', 'ASC']]
    });
    return documentTypes;
};

const createDocumentType = async (data) => {
    const { name } = data.body;
    if (!name) {
        throw new BadRequestError("Thiếu tên loại tài liệu");
    }
    const documentType = await DocumentType.create({ name });
    return documentType;
};

export const documentTypesService = {
    getDocumentTypes,
    createDocumentType
};