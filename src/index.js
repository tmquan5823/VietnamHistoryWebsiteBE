import express from "express";
import dotenv from 'dotenv';
import { ErrorHanlder } from "./middlewares/ErrorHandler.js";
import cors from "cors";
import "express-async-errors";
import { sequelize, connectDB } from "./database/connect.js";
import { models } from "./models/index.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Router
import authRouter from "./routes/authRoutes.js";
import periodsRouter from "./routes/periodsRoutes.js";
import historyDocumentsRouter from "./routes/historyDocumentRoutes.js";
import documentTypesRouter from "./routes/documentTypesRoutes.js";
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/periods", periodsRouter);
app.use("/api/v1/history-documents", historyDocumentsRouter);
app.use("/api/v1/document-types", documentTypesRouter);
app.use(ErrorHanlder);  

const start = async () => {
    try {
        await connectDB();
        console.log('Database connection established');
        
        // Sync all models with database
        await sequelize.sync({ alter: true });
        console.log('Database tables synchronized');
        
        app.listen(process.env.PORT, () => {
            console.log('Listening on port ' + process.env.PORT);
        });
    } catch (error) {
        console.log('Failed to start server:', error);
    }
};

start();
