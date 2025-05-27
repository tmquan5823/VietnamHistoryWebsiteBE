import Period from "../models/period.model.js";
import dotenv from "dotenv";



dotenv.config();

const getPeriods = async (data) => {
    const periods = await Period.findAll();
    return periods;
};

const createPeriod = async (data) => {
    const { name, description, start_year, end_year } = data.body;
    if (!name || !description || !start_year || !end_year) {
        throw new BadRequestError("Thiếu thông tin");
    }
    const period = await Period.create({ name, description, start_year, end_year });
    return period;
};

export const periodsService = {
    getPeriods,
    createPeriod
};