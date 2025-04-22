import express from "express";
import dotenv from 'dotenv';
import { ErrorHanlder } from "./middlewares/ErrorHandler.js";
import cors from "cors";
import "express-async-errors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Router
import authRouter from "./routes/authRoutes.js";

app.use("/api/v1/auth", authRouter);
app.use(ErrorHanlder);

// Connect Database
import connectDB from "./database/connect.js";

const start = async () => {
    try {
        console.log(process.env);
        await connectDB(String(process.env.MONGODB_URI));
        app.listen(process.env.PORT, () => {
            console.log('Listening on port ' + process.env.PORT);
        });
    } catch (error) {
        console.log(error);
    }
};

start();
