import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';

const Topic = sequelize.define('Topic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'topics',
  timestamps: false,
  defaultScope: {
    attributes: { exclude: ['createdAt'] }
  }
});

export default Topic; 