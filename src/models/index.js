import { sequelize } from '../database/connect.js';
import { DataTypes } from 'sequelize';
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
import UserToken from './userToken.model.js';
import User from './user.model.js';

// Export all models
export const models = {
  User,
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
  QuizSet,
  UserToken
};

// Define associations here if needed
// Example: User.hasMany(Post);
