import express from "express";
import dotenv from 'dotenv';
import { ErrorHanlder } from "./middlewares/ErrorHandler.js";
import cors from "cors";
import "express-async-errors";
import { sequelize, connectDB } from "./database/connect.js";
import { models } from "./models/index.js";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import Notification from "./models/notification.model.js";
import { setupSocket } from "./socket/socket.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Gắn io vào req để controller có thể sử dụng req.io.emit
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Router
import authRouter from "./routes/authRoutes.js";
import periodsRouter from "./routes/periodsRoutes.js";
import historyDocumentsRouter from "./routes/historyDocumentRoutes.js";
import documentTypesRouter from "./routes/documentTypesRoutes.js";
import quizRouter from "./routes/quizRoutes.js";
import topicRouter from "./routes/topicRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";
import forumPostRouter from "./routes/forumPostRoutes.js";
import profileRouter from "./routes/profileRoutes.js";
import userRouter from "./routes/userRoutes.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/periods", periodsRouter);
app.use("/api/v1/history-documents", historyDocumentsRouter);
app.use("/api/v1/document-types", documentTypesRouter);
app.use("/api/v1/quiz-sets", quizRouter);
app.use("/api/v1/topics", topicRouter);
app.use("/api/v1/forum-posts", forumPostRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/upload-image", uploadRouter);

app.use(ErrorHanlder);  

// Tạo HTTP server từ Express app
const server = http.createServer(app);

// Khởi tạo socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Tách xử lý socket ra file riêng
setupSocket(io);

const start = async () => {
    try {
        await connectDB();
        console.log('Database connection established');
        
        // Sync all models with database
        await sequelize.sync({ alter: true });
        console.log('Database tables synchronized');
        
        // Sử dụng server.listen thay vì app.listen
        server.listen(process.env.PORT, () => {
            console.log('Listening on port ' + process.env.PORT);
        });
    } catch (error) {
        console.log('Failed to start server:', error);
    }
};

start();
