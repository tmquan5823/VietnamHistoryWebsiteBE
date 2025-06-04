import { StatusCodes } from "http-status-codes";
import { profileService } from "../services/profileService.js";

const getProfile = async (req, res, next) => {
    try {
        const result = await profileService.getProfile(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy thông tin người dùng thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const updateProfile = async (req, res, next) => {
    try {
        const result = await profileService.updateProfile(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Cập nhật thông tin người dùng thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const changePassword = async (req, res, next) => {
    try {
        const result = await profileService.changePassword(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Đổi mật khẩu thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

export const profileController = {
    getProfile,
    updateProfile,
    changePassword
}
