import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';
import User from './user.model.js';

const QuizSet = sequelize.define('QuizSet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  image: {
    type: DataTypes.STRING(255)
  },
  title: {
    type: DataTypes.STRING(255)
  },
  description: {
    type: DataTypes.TEXT
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('unpublish', 'pending', 'publish', 'approved', 'inactive'),
    defaultValue: 'unpublish',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  image_public_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'quiz_sets',
  timestamps: false
});

export default QuizSet;

QuizSet.belongsTo(User, { foreignKey: 'created_by', as: 'creator' }); 