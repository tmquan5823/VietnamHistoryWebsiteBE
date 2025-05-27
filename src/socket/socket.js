import Notification from "../models/notification.model.js";

export const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Gửi danh sách thông báo khi client yêu cầu
    socket.on("getNotifications", async (data) => {
      try {
        const { user_id, page = 1, limit = 5 } = data || {};
        let where = {};
        if (user_id) where.user_id = user_id;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Lấy tổng số thông báo
        const count = await Notification.count({ where });

        // Lấy thông báo theo trang
        const dbNotifications = await Notification.findAll({
          where,
          order: [["createdAt", "DESC"]],
          offset,
          limit: parseInt(limit)
        });

        socket.emit("notifications", { notifications: dbNotifications, total: count });
      } catch (err) {
        socket.emit("notifications", { notifications: [], total: 0 });
      }
    });

    // Gửi thông báo mới tới tất cả client
    socket.on("sendNotification", (notification) => {
      const newNotification = { ...notification, createdAt: new Date() };
      io.emit("newNotification", newNotification);
    });

    // Đánh dấu notification là đã đọc
    socket.on("readNotification", async ({ id, user_id }) => {
      try {
        if (!id || !user_id) return;
        const notification = await Notification.findOne({ where: { id, user_id } });
        if (!notification) return;
        await notification.update({ is_read: true });
        // Lấy lại danh sách notification đã cập nhật
        const count = await Notification.count({ where: { user_id } });
        const dbNotifications = await Notification.findAll({
          where: { user_id },
          order: [["createdAt", "DESC"]],
          limit: 50
        });
        socket.emit("notifications", { notifications: dbNotifications, total: count });
      } catch (err) {
        // Có thể gửi lỗi nếu muốn
      }
    });

    // Đánh dấu tất cả notification là đã đọc
    socket.on("readAllNotifications", async (user_id) => {
      try {
        if (!user_id) return;
        await Notification.update({ is_read: true }, { where: { user_id } });
        // Lấy lại danh sách notification đã cập nhật
        const count = await Notification.count({ where: { user_id } });
        const dbNotifications = await Notification.findAll({
          where: { user_id },
          order: [["createdAt", "DESC"]],
          limit: 50
        });
        socket.emit("notifications", { notifications: dbNotifications, total: count });
      } catch (err) {
        // Có thể gửi lỗi nếu muốn
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
