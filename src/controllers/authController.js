import User from "../models/User.js";
import BadRequestError from "../errors/BadRequestError.js";
import bcrypt from "bcrypt";
import nodemailer from 'nodemailer';
import InternalServerError from "../errors/InternalServerError .js";
import dotenv from "dotenv";
import NotFoundError from "../errors/NotFoundError.js";
import { StatusCodes } from "http-status-codes";
import { authService } from "../services/authService.js";

//Sign up
const signUp = async (req, res, next) => {
    try {
        const result = await authService.signUp(req);
        console.log(result);
        return res.status(StatusCodes.OK).json({
            status: "pending",
            message: "Mã OTP đã được gửi tới email của bạn!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const verifyOTP = async (req, res, next) => {
    try {
        await authService.verifyOTP(req);

        return res.status(StatusCodes.OK).json({
            status: "verified",
            message: "Xác thực tài khoản thành công!"
        });
    } catch(error) {
        next(error);
    }
};

//Resend OTP
const resendOTP = async (req, res, next) => {
    try{
        await authService.resendOTP(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Mã OTP đã được gửi tới email của bạn!"
        });
    } catch(error){
        next(error);
    }
}; 


//Login
const login = async (req, res, next) => {
    try{
        const result = await authService.login(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Đăng nhập thành công!",
            data: result
        });
    } catch(error){
        next(error);
    }
};

//Refresh Token
const refreshToken = async (req, res, next) => {
    try{
        const result = await authService.refreshToken(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            accessToken: result
        })
    } catch(error){
        next(error);
    }
}

export const authController = {
    signUp, 
    verifyOTP,
    resendOTP,
    login, 
    refreshToken
};