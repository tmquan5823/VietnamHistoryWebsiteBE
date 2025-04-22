module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current", // Đặt node version mà bạn đang sử dụng
        },
      },
    ],
  ],
};
