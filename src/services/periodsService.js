import Period from "../models/period.model.js";
import BadRequestError from "../errors/BadRequestError.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import NotFoundError from "../errors/NotFoundError.js";
import UnauthorizedError from "../errors/UnauthorizedError.js";
import ForbiddenError from "../errors/ForbiddenError.js";
import jwt from "jsonwebtoken";
import randToken from "rand-token";
import UserToken from "../models/userToken.model.js";
import HistoryDocument from "../models/historyDocument.model.js";


dotenv.config();

const getPeriods = async (data) => {
    const periods = await Period.findAll();
    return periods;
};

const createPeriod = async (data) => {
    const { name, description, start_year, end_year } = data.body;
    const period = await Period.create({ name, description, start_year, end_year });
    return period;
};

export const periodsService = {
    getPeriods,
    createPeriod
};