import User from "../models/User.js";
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
    const {email, password, fullname} = data.body;

    try {        
        const emailIsExist = await User.findOne({email});
        if(emailIsExist) {
            throw new BadRequestError("Email đã tồn tại, vui lòng đăng ký với email khác!");
        }
        
        const saltRounds = 10;
        const hashedPass = await bcrypt.hash(password, saltRounds); 
        const newUser = new User({
            email, 
            password: hashedPass,
            fullname,
            role: "user",
            verified: false,
            avatar: process.env.AVT_DEFAULT
        });

        await newUser.save(); 

        const result = await sendOTPVerificationEmail(email);
        console.log(result);
        return result; 
    } catch (error) {
        throw error;
    }
};

const sendOTPVerificationEmail = async (email) => {
    try{
        const user = await User.findOne({email});

        if(!user){
            throw new NotFoundError("Không tìm thấy thông tin người dùng, vui lòng đăng ký!");
        }
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: "GAKU - Xác thực email",
            html: `<p>Mã xác thực của bạn là: <b>${otp}</b></p>
            <br>
            <p>Mã xác thực sẽ hết hạn trong 1 giờ!</p>`
        }

        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp, saltRounds);
        user.otpVerification = {
            otp: hashedOTP,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000)
        }
        await user.save();

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
        const user = await User.findOne({email});
        if(user.length <= 0){
            throw new NotFoundError("Không tìm thấy tài khoản người dùng, xin vui lòng đăng ký!");
        }
        const {expiresAt} = user.otpVerification;
        const hashedOTP = user.otpVerification.otp;
        if (expiresAt < Date.now()) {
            user.otpVerification = {}; 
            await user.save(); 
            throw new BadRequestError("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }
        const validOTP = await bcrypt.compare(otp, hashedOTP);
        if(!validOTP){
            throw new Error("Ma OTP khong hop le!");
        }
        user.verified = true;
        user.otpVerification = undefined;
        await user.save();
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
        const user = await User.findOne({email});   
        if(!user){
            throw new NotFoundError("Không tìm thấy người dùng, vui lòng đăng ký!");
        }
        if(user.verified){
            throw BadRequestError("Tài khoản đã được xác thực, vui lòng đăng nhập!");
        }
        user.otpVerification = {};
        sendOTPVerificationEmail(user.email);

        return;

    } catch(error){
        next(error);
    }
}; 

const login = async (data) => {
    try{
        const {email, password} = data.body;
        const user = await User.findOne({email});
        if(!email || !password){
            throw new BadRequestError("Tham số email hoặc password không hợp lệ!");
        }
        
        if(!user){
            throw new NotFoundError("Không tìm thấy tài khoản, vui lòng đăng ký!");
        }
        const isMatchPassword = await bcrypt.compare(password, user.password);
        if(!isMatchPassword){
            throw new UnauthorizedError("Mật khẩu không chính xác, vui lòng thử lại!");
        }
        if(!user.verified){
            throw new ForbiddenError("Tài khoản chưa được xác thực, vui lòng xác thực để đăng nhập!");
        }

        if(user.isBanned){
            throw new ForbiddenError("Tài khoản của bạn đã bị cấm!");
        }

        const payload = {
            id: user._id.toString(),
            role: user.role
        }
        const accessToken = jwt.sign(payload, 
            process.env.JWT_SECRET, 
            {
                expiresIn: process.env.JWT_SECRET
            });
        if(!accessToken){
            throw new UnauthorizedError("Đăng nhập không thành công, vui lòng thử lại!");
        }
        let refreshToken = randToken.generate(256);
        if(!user.refreshToken){
            user.refreshToken = refreshToken;
            await user.save();
        }
        else {
            refreshToken = user.refreshToken;
        }
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
    try{
        const refreshToken = data.body.refreshToken;
        if(!refreshToken){
            throw new BadRequestError("Không tìm thấy Refresh Token!");
        }
        const user = await User.findById(data.userId);
        if(!user) {
            throw new NotFoundError("Người dùng không tồn tại!");
        }
        
        if(refreshToken !== user.refreshToken){
            throw new BadRequestError("Refresh Token không hợp lệ!");
        }

        const payload = {
            id: user._id.toString(),
            role: user.role
        }
        const accessToken = jwt.sign(payload, 
            process.env.JWT_SECRET, 
            {
                expiresIn: process.env.JWT_SECRET
            });
        if(!accessToken){
            throw new UnauthorizedError("Đăng nhập không thành công, vui lòng thử lại!");
        }
        return accessToken;
    }catch(error){
        throw error;
    }
};

export const authService = {
    signUp, 
    verifyOTP,
    resendOTP,
    login,
    refreshToken
};