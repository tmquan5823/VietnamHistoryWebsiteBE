import User from "../models/user.model.js";
import EmailVerification from "../models/emailVerification.model.js";
import BadRequestError from "../errors/BadRequestError.js";
import bcrypt from "bcrypt";
import nodemailer from 'nodemailer';
import InternalServerError from "../errors/InternalServerError .js";
import dotenv from "dotenv";
import NotFoundError from "../errors/NotFoundError.js";
import UnauthorizedError from "../errors/UnauthorizedError.js";
import ForbiddenError from "../errors/ForbiddenError.js";
import jwt from "jsonwebtoken";
import randToken from "rand-token";
import UserToken from "../models/userToken.model.js";
import { SALT_ROUNDS } from "../constaints.js";

dotenv.config();

// Tạo transporter cho nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD 
    },
});

//Sign up
const signUp = async (data) => {
    const {email, password, fullname, gender, birthday} = data.body;

    try {        
        const emailIsExist = await User.findOne({
            where: { email: email }
        });
        if(emailIsExist) {
            throw new BadRequestError("Email đã tồn tại, vui lòng đăng ký với email khác!");
        }
        
        const saltRounds = SALT_ROUNDS;
        const hashedPass = await bcrypt.hash(password, saltRounds); 
        const newUser = await User.create({
            email, 
            password: hashedPass,
            fullname,
            role: "user",
            gender,
            birthday,
            avatar: gender === "female" ? process.env.FEMALE_AVT_DEFAULT : process.env.MALE_AVT_DEFAULT
        });

        const result = await sendOTPVerificationEmail(newUser);
        return result; 
    } catch (error) {
        throw error;
    }
};

const sendOTPVerificationEmail = async (user) => {
    try{
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await EmailVerification.create({
            user_id: user.id,
            otp_code: otp,
            expires_at: expiresAt
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: "Xác thực email",
            html: `<p>Mã xác thực của bạn là: <b>${otp}</b></p>
            <br>
            <p>Mã xác thực sẽ hết hạn trong 1 giờ!</p>`
        }

        const info = await transporter.sendMail(mailOptions);
        if (info.accepted.length <= 0){
            throw new InternalServerError("Lỗi khi gửi mã xác thực, xin hãy thử lại!");
        } 

        return user;

    } catch(error){
        throw error;
    }
};

export const verifyOTP = async (data) => {
    try {
        const {email, otp} = data.body;
        if(!email || !otp){
            throw new BadRequestError("OTP không hợp lệ!");
        }

        const user = await User.findOne({
            where: { email: email }
        });
        if(!user){
            throw new NotFoundError("Không tìm thấy tài khoản người dùng, xin vui lòng đăng ký!");
        }

        const verification = await EmailVerification.findOne({
            where: {
                user_id: user.id,
                is_verified: false
            }
        });

        if (!verification) {
            throw new BadRequestError("Không tìm thấy mã xác thực, vui lòng yêu cầu mã mới!");
        }

        if (verification.expires_at < new Date()) {
            throw new BadRequestError("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        if (verification.otp_code !== String(otp)) {
            throw new BadRequestError("Mã OTP không hợp lệ!");
        }

        // Update verification status
        await verification.update({ is_verified: true });

        return;
    } catch(error) {
        throw error;
    }
};

//Resend OTP
const resendOTP = async (data) => {
    try{
        const {email} = data.body;
        if(!email){
            throw new BadRequestError("Thông tin không hợp lệ, vui lòng thử lại!");
        }

        const user = await User.findOne({
            where: { email: email }
        });   
        if(!user){
            throw new NotFoundError("Không tìm thấy người dùng, vui lòng đăng ký!");
        }

        // Delete existing verification if exists
        await EmailVerification.destroy({
            where: {
                user_id: user.id,
                is_verified: false
            }
        });

        await sendOTPVerificationEmail(user);
        return;

    } catch(error){
        throw error;
    }
};

const login = async (data) => {
    try{
        const {email, password} = data.body;

        if(!email || !password){
            throw new BadRequestError("Tham số email hoặc password không hợp lệ!");
        }

        const user = await User.findOne({where: {email}});
        
        if(!user){
            throw new NotFoundError("Không tìm thấy tài khoản, vui lòng đăng ký!");
        }
        const isMatchPassword = await bcrypt.compare(password, user.password);
        if(!isMatchPassword){
            throw new UnauthorizedError("Mật khẩu không chính xác, vui lòng thử lại!");
        }

        const is_verified = await EmailVerification.findOne({
            where: {
                user_id: user.id,
                is_verified: true
            }
        });

        if(!is_verified){
            await sendOTPVerificationEmail(user);
            throw new ForbiddenError("Tài khoản chưa được xác thực, mã xác thực đã được gửi lại email của bạn!");
        }

        if(user.isBanned){
            throw new ForbiddenError("Tài khoản của bạn đã bị cấm!");
        }

        const payload = {
            id: user.id,
            role: user.role
        }
        const accessToken = jwt.sign(payload, 
            process.env.JWT_SECRET, 
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            });
        if(!accessToken){
            throw new UnauthorizedError("Đăng nhập không thành công, vui lòng thử lại!");
        }

        const refreshToken = randToken.generate(256);
 
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        await UserToken.create({
            user_id: user.id,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt
        });

        return {
            user,
            accessToken,
            refreshToken
        };
    } catch(error){
        throw error;
    }
};

const refreshToken = async (data) => {
    try {
        const { refreshToken } = data.body;
        if (!refreshToken) {
            throw new BadRequestError("Không tìm thấy Refresh Token!");
        }

        // Find the token record
        const tokenRecord = await UserToken.findOne({
            where: { refresh_token: refreshToken },
            include: [{
                model: User,
                required: true
            }]
        });

        if (!tokenRecord) {
            throw new UnauthorizedError("Refresh Token không hợp lệ!");
        }

        // Check if token is expired
        if (tokenRecord.expires_at < new Date()) {
            // Delete expired token
            await tokenRecord.destroy();
            throw new UnauthorizedError("Refresh Token đã hết hạn, vui lòng đăng nhập lại!");
        }

        const user = tokenRecord.User;
        if (!user) {
            throw new NotFoundError("Người dùng không tồn tại!");
        }

        // Generate new access token
        const payload = {
            id: user.id,
            role: user.role
        };
        
        const newAccessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            }
        );

        if (!newAccessToken) {
            throw new UnauthorizedError("Không thể tạo Access Token mới!");
        }

        // Calculate new expiration time
        const newExpiresAt = new Date();
        newExpiresAt.setHours(newExpiresAt.getHours() + 1); // 1 hour from now

        // Update token record with new access token and expiration
        await tokenRecord.update({
            access_token: newAccessToken,
            expires_at: newExpiresAt
        });

        return {
            accessToken: newAccessToken,
            refreshToken: tokenRecord.refresh_token
        };
    } catch (error) {
        throw error;
    }
};

// Quên mật khẩu - gửi OTP về email
const forgotPassword = async (data) => {
    try {
        const { email } = data.body;
        if (!email) {
            throw new BadRequestError("Vui lòng nhập email!");
        }
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundError("Không tìm thấy tài khoản với email này!");
        }
        // Xóa các OTP cũ chưa xác thực (nếu có)
        await EmailVerification.destroy({
            where: {
                user_id: user.id,
                is_verified: false
            }
        });
        await sendOTPVerificationEmail(user);
        return { message: "Mã xác thực đã được gửi về email của bạn!" };
    } catch (error) {
        throw error;
    }
};

// Đặt lại mật khẩu với OTP
const resetPassword = async (data) => {
    try {
        const { email, otp, newPassword } = data.body;
        if (!email || !otp || !newPassword) {
            throw new BadRequestError("Thiếu thông tin cần thiết!");
        }
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundError("Không tìm thấy tài khoản với email này!");
        }
        const verification = await EmailVerification.findOne({
            where: {
                user_id: user.id,
                is_verified: false
            }
        });
        if (!verification) {
            throw new BadRequestError("Không tìm thấy mã xác thực, vui lòng yêu cầu mã mới!");
        }
        if (verification.expires_at < new Date()) {
            throw new BadRequestError("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }
        if (verification.otp_code !== String(otp)) {
            throw new BadRequestError("Mã OTP không hợp lệ!");
        }
        // Đặt lại mật khẩu
        const saltRounds = SALT_ROUNDS;
        const hashedPass = await bcrypt.hash(newPassword, saltRounds);
        await user.update({ password: hashedPass });
        // Đánh dấu OTP đã dùng
        await verification.update({ is_verified: true });
        return { message: "Đặt lại mật khẩu thành công!" };
    } catch (error) {
        throw error;
    }
};

export const authService = {
    signUp,
    verifyOTP,
    resendOTP,
    login,
    refreshToken,
    forgotPassword,
    resetPassword
};