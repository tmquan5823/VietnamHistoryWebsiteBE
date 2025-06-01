import { StatusCodes } from "http-status-codes";
import { userService } from "../services/userService.js";

const getAllUsers = async (req, res, next) => {
    try {
        const result = await userService.getAllUsers(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy danh sách tài khoản thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const getUserById = async (req, res, next) => {
    try {
        const result = await userService.getUserById(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Lấy tài khoản thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const updateUserRole = async (req, res, next) => {
    try {
        const result = await userService.updateUserRole(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Cập nhật vai trò tài khoản thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const banUser = async (req, res, next) => {
    try {
        const result = await userService.banUser(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Khóa tài khoản thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const unBanUser = async (req, res, next) => {
    try {
        const result = await userService.unBanUser(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Mở khóa tài khoản thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const updateUser = async (req, res, next) => {
    try {
        const result = await userService.updateUser(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Cập nhật tài khoản thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}

const createUser = async (req, res, next) => {
    try {
        const result = await userService.createUser(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Tạo tài khoản thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
}


export const userController = {
    getAllUsers,
    getUserById,
    updateUserRole,
    banUser,
    unBanUser,
    updateUser,
    createUser
}
