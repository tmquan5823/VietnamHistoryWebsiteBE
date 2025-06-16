import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo sequelize instance
const sequelize = new Sequelize(process.env.POSTGRESQL_URI, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
    },
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connected successfully');
    } catch (error) {
        console.log(error)
        console.error('PostgreSQL connection failed:', error.message);
        process.exit(1);
    }
};

export { sequelize, connectDB };