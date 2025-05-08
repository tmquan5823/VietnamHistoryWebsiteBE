import { StatusCodes } from "http-status-codes";
import { periodsService } from "../services/periodsService.js";

//Sign up
const getPeriods = async (req, res, next) => {
    try {
        const result = await periodsService.getPeriods(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy danh sách kỳ hạn thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};
    
const createPeriod = async (req, res, next) => {
    try {
        const result = await periodsService.createPeriod(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Tạo kỳ hạn thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};


export const periodsController = {
    getPeriods,
    createPeriod
};