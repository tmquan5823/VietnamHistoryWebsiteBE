import { StatusCodes } from "http-status-codes";
import { forumPostService } from "../services/forumPostService.js";
const createForumPost = async (req, res, next) => {
    try {
        const result = await forumPostService.createForumPost(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Bài viết đã được tạo thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const getForumPosts = async (req, res, next) => {
    try {
        const result = await forumPostService.getForumPosts(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Bài viết đã được lấy thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const updateForumPost = async (req, res, next) => {
    try {
        const result = await forumPostService.updateForumPost(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Bài viết đã được cập nhật thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const deleteForumPost = async (req, res, next) => {
    try {
        const result = await forumPostService.deleteForumPost(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Bài viết đã được xóa thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const approveForumPost = async (req, res, next) => {
    try {
        const result = await forumPostService.approveForumPost(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Bài viết đã được duyệt thành công!",  
            data: result
        });
    } catch(err){
        next(err);
    }
};

const inactiveForumPost = async (req, res, next) => {
    try {
        const result = await forumPostService.inactiveForumPost(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Bài viết đã được vô hiệu hóa thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const activeForumPost = async (req, res, next) => {
    try {   
        const result = await forumPostService.activeForumPost(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Bài viết đã được kích hoạt thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const rejectForumPost = async (req, res, next) => {
    try {
        const result = await forumPostService.rejectForumPost(req);
        return res.status(StatusCodes.OK).json({
            status: "success",      
            message: "Bài viết đã được từ chối thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};


const submitForumPost = async (req, res, next) => {
    try {
        const result = await forumPostService.submitForumPost(req);
        return res.status(StatusCodes.OK).json({
            status: "success",  
            message: "Bài viết đã được đăng tải thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};


const cancelForumPost = async (req, res, next) => {
    try {
        const result = await forumPostService.cancelForumPost(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Bài viết đã được hủy thành công!",    
            data: result
        });
    } catch(err){
        next(err);
    }
};


const getApprovedForumPosts = async (req, res, next) => {
    try {
        const result = await forumPostService.getApprovedForumPosts(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Bài viết đã được lấy thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const getForumPostByToken = async (req, res, next) => {
    try {
        const result = await forumPostService.getForumPostByToken(req);
        return res.status(StatusCodes.OK).json({
            status: "success",
            message: "Bài viết đã được lấy thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const getPostById = async (req, res, next) => {
    try {
        const result = await forumPostService.getPostById(req);
        return res.status(StatusCodes.OK).json({
            status: "success",  
            message: "Bài viết đã được lấy thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};

const getForumPostReview = async (req, res, next) => {
    try {
        const result = await forumPostService.getForumPostReview(req);
        return res.status(StatusCodes.OK).json({
            status: "success",  
            message: "Bài viết đã được lấy thành công!",
            data: result
        });
    } catch(err){
        next(err);
    }
};


export const forumPostController = {
    createForumPost,
    getForumPosts,
    updateForumPost,
    deleteForumPost,
    approveForumPost,
    rejectForumPost,
    inactiveForumPost,
    activeForumPost,
    getApprovedForumPosts,
    getForumPostByToken,
    getPostById,
    cancelForumPost,
    submitForumPost,
    getForumPostReview
};
