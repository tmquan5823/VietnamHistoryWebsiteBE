import BadRequestError from "../errors/BadRequestError.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import { SALT_ROUNDS } from "../constaints.js";

const getProfile = async (req) => {
    const userId = req.userId;
    const profile = await User.findOne({
        where: {id: userId}
    });
    if(!profile) {
        throw new BadRequestError("Không tìm thấy người dùng");
    }
    return profile;
}

const updateProfile = async (req) => {
    const userId = req.userId;
    const {fullname, gender, birthday} = req.body;
    const profile = await User.findOne({
        where: {id: userId}
    });
    if(!profile) {
        throw new BadRequestError("Không tìm thấy người dùng");
    }
    profile.fullname = fullname;
    profile.gender = gender;
    profile.birthday = birthday;
    // Cập nhật avatar nếu có file upload
    if (req.file && req.file.path) {
        profile.avatar = req.file.path;
    }
    await profile.save();
    return profile;
}

const changePassword = async (req) => {
    const userId = req.userId;
    const {oldPassword, newPassword} = req.body;
    const profile = await User.findOne({
        where: {id: userId}
    });
    if(!profile) {
        throw new BadRequestError("Không tìm thấy người dùng");
    }

    const isMatchPassword = await bcrypt.compare(oldPassword, profile.password);
    if(!isMatchPassword) {
        throw new BadRequestError("Mật khẩu cũ không khớp");
    }

    const saltRounds = SALT_ROUNDS;
    const hashedPass = await bcrypt.hash(newPassword, saltRounds);
    profile.password = hashedPass;
    await profile.save();
    return profile;
}

export const profileService = {
    getProfile,
    updateProfile,
    changePassword
}
