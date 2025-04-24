import { sequelize } from '../database/connect.js';
import { DataTypes } from 'sequelize';
import User from './user.model.js';
import AdminLog from './adminLog.model.js';
import DocumentType from './documentType.model.js';
import EmailVerification from './emailVerification.model.js';
import ForumPost from './forumPost.model.js';
import ForumPostComment from './forumPostComment.model.js';
import ForumPostLike from './forumPostLike.model.js';
import HistoryDocument from './historyDocument.model.js';
import Period from './period.model.js';
import QuizLeaderboard from './quizLeaderboard.model.js';
import QuizQuestion from './quizQuestion.model.js';
import QuizSet from './quizSet.model.js';

// Define all models
const UserModel = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  fullname: {
    type: DataTypes.STRING(100)
  },
  avatar: {
    type: DataTypes.STRING(255)
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: false
});

// Export all models
export const models = {
  User: UserModel,
  AdminLog,
  DocumentType,
  EmailVerification,
  ForumPost,
  ForumPostComment,
  ForumPostLike,
  HistoryDocument,
  Period,
  QuizLeaderboard,
  QuizQuestion,
  QuizSet
};

// Define associations here if needed
// Example: User.hasMany(Post);
