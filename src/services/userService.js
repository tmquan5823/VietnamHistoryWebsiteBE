import User from "../models/user.model.js";
import BadRequestError  from "../errors/BadRequestError.js";
import NotFoundError from "../errors/NotFoundError.js";
const getAllUsers = async (req) => {
    try {
        const userId = req.userId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        const where = {};
        const { search, role, status } = req.query;
        if (search) {
            where["$or"] = [
                { fullname: { $like: `%${search}%` } },
                { email: { $like: `%${search}%` } }
            ];
        }
        if (role) {
            where.role = role;
        }
        if (status === "active") {
            where.isBanned = false;
        } else if (status === "banned") {
            where.isBanned = true;
        }

        let sortBy = req.query.sortBy || 'id';
        let sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
        const validSortFields = ['id', 'fullname', 'email', 'createdAt'];
        if (!validSortFields.includes(sortBy)) sortBy = 'id';

        const { count: total, rows: users } = await User.findAndCountAll({
            where,
            offset,
            limit: pageSize,
            order: [[sortBy, sortOrder]]
        });
        if (!search && !role) {
            const currentUserIndex = users.findIndex(u => u.id === userId);
            if (currentUserIndex > 0) {
                const [currentUser] = users.splice(currentUserIndex, 1);
                users.unshift(currentUser);
            }
        }
        return {
            users,
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
        };
    } catch(err){
        throw err;
    }
}

const getUserById = async (req) => {
    try {
        const { id } = req.params;
        if(!id){
            throw new BadRequestError("Id là bắt buộc");
        }
        const user = await User.findByPk(id);
        if (!user) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }
        return user;
    } catch(err){
        throw err;
    }
}

const updateUserRole = async (req) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if(!role){
            throw new BadRequestError("Vai trò là bắt buộc");
        }
        const user = await User.findByPk(id);
        if (!user) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }
        user.role = role;
        await user.save();
        return user;
    } catch(err){
        throw err;
    }
}

const banUser = async (req) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }
        if(user.isBanned){
            throw new BadRequestError("Người dùng đã bị khóa trước đó");
        }
        user.isBanned = true;
        await user.save();
        return user;
    } catch(err){
        throw err;
    }
}

const unBanUser = async (req) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);   
        if (!user) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }
        if(!user.isBanned){
            throw new BadRequestError("Người dùng chưa bị khóa");
        }
        user.isBanned = false;
        await user.save();
        return user;
    } catch(err){
        throw err;
    }
}   


const updateUser = async (req) => {
    try {
        const { id } = req.params;
        const { fullname, gender, birthday, role } = req.body;
        const user = await User.findByPk(id);
        if (!user) {
            throw new NotFoundError("Không tìm thấy người dùng");
        }
        if (fullname) {
            user.fullname = fullname;
        }
        if (gender) {
            user.gender = gender;
        }
        if (birthday) {
            user.birthday = birthday;
        }
        if (role) {
            user.role = role;
        }
        if (req.file && req.file.path) {
            user.avatar = req.file.path;
        }
        await user.save();
        return user;
    } catch(err){
        throw err;
    }
}

export const userService = {
    getAllUsers,
    getUserById,
    updateUserRole,
    banUser,
    unBanUser,
    updateUser
}
