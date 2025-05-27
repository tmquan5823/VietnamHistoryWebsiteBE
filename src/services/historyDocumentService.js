import BadRequestError from "../errors/BadRequestError.js";
import dotenv from "dotenv";
import NotFoundError from "../errors/NotFoundError.js";
import HistoryDocument from "../models/historyDocument.model.js";
import { Op } from "sequelize";


dotenv.config();

const createDocument = async (data) => {
    const {
        title,
        content,
        type_id,
        period_id,
        start_year,
        end_year,
        userId,
        image
    } = data.body;

    if (!title || !content || !type_id || !period_id || !start_year || !end_year) {
        throw new BadRequestError("Thiếu thông tin bắt buộc!");
    }

    const newDocument = await HistoryDocument.create({
        title,
        content,
        type_id,
        period_id,
        start_year,
        end_year,
        uploaded_by: userId,
        createdAt: new Date(),
        createdAt: new Date(),
        image
    });

    return newDocument;
};


const getDocuments = async (req) => {
    let where = {};
    const { typeId, periodId, startYear, endYear, sort, page, limit, keyWords } = req.query;

    if (typeId) where.type_id = typeId;
    if (periodId) where.period_id = periodId;
    
    if (startYear && endYear) {
        where.start_year = { [Op.between]: [startYear, endYear] };
    } else if (startYear) {
        where.start_year = { [Op.gte]: startYear };
    } else if (endYear) {
        where.start_year = { [Op.lte]: endYear };
    }

    if (keyWords) {
        const decodedKeyWords = decodeURIComponent(keyWords.replace(/\+/g, ' '));
        where.key_words = { [Op.iLike]: `%${decodedKeyWords}%` };
    }

    const order = [["start_year", sort === "desc" ? "DESC" : "ASC"]];
    let options = { where, order };

    if (page && limit) {
        options.offset = (parseInt(page) - 1) * parseInt(limit);
        options.limit = parseInt(limit);
    }

    const { rows: documents, count: total } = await HistoryDocument.findAndCountAll(options);

    return { documents, total };
};

const getDocumentById = async (req) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    const document = await HistoryDocument.findByPk(id);
    if (!document) {
        throw new NotFoundError("Không tìm thấy tài liệu!");
    }
    return document;
};

const getDocumentsTitle = async (req) => {
    let where = {};
    const { typeId, periodId, startYear, endYear, page, limit, keyWords, sort } = req.query;
    if (typeId) where.type_id = typeId;
    if (periodId) where.period_id = periodId;
    if (startYear && endYear) {
        where.start_year = { [Op.between]: [startYear, endYear] };
    } else if (startYear) {
        where.start_year = { [Op.gte]: startYear };
    } else if (endYear) {
        where.start_year = { [Op.lte]: endYear };
    }
    if (keyWords) {
        const decodedKeyWords = decodeURIComponent(keyWords.replace(/\+/g, ' '));
        where.key_words = { [Op.iLike]: `%${decodedKeyWords}%` };
    }
    const order = [["start_year", sort === "desc" ? "DESC" : "ASC"]];
    let options = {
        where,
        attributes: ['title', 'id', 'start_year', 'end_year', 'type_id', 'period_id', 'image'],
        order,
    };
    if (page && limit) {
        options.offset = (parseInt(page) - 1) * parseInt(limit);
        options.limit = parseInt(limit);
    }
    const { rows: documents, count: total } = await HistoryDocument.findAndCountAll(options);
    return { documents, total };
};

const updateDocument = async (req) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    const { title, content, type_id, period_id, start_year, end_year, key_words } = req.body;
    if (!title || !content || !type_id || !period_id || !start_year || !end_year) {
        throw new BadRequestError("Thiếu thông tin bắt buộc!");
    }
    const document = await HistoryDocument.findByPk(id);
    if (!document) {
        throw new NotFoundError("Không tìm thấy tài liệu!");
    }
    await document.update({ title, content, type_id, period_id, start_year, end_year, key_words });
    return document;
};  

const deleteDocument = async (req) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequestError("Thiếu id");
    }
    const document = await HistoryDocument.findByPk(id);
    if (!document) {
        throw new NotFoundError("Không tìm thấy tài liệu!");
    }
    await document.destroy();
    return document;
};

export const historyDocumentService = {
    createDocument,
    getDocuments,
    getDocumentById,
    getDocumentsTitle,
    updateDocument,
    deleteDocument,
};