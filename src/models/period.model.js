import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';

const Period = sequelize.define('Period', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  start_year: {
    type: DataTypes.INTEGER
  },
  end_year: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'periods',
  timestamps: false
});

export default Period; 