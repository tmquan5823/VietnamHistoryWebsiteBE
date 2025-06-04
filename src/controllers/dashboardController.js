import { StatusCodes } from "http-status-codes";
import { dashboardService } from "../services/dashboardService.js";

const getHomePageData = async (req, res, next) => {
    try {
        const result = await dashboardService.getHomePageData(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy dữ liệu trang chủ thành công!",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getDashboardData = async (req, res, next) => {
    try {
        const result = await dashboardService.getDashboardData(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy dữ liệu dashboard thành công!",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const dashboardController = {
    getHomePageData,
    getDashboardData
};

