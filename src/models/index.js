import DocumentType from './documentType.model.js';
import EmailVerification from './emailVerification.model.js';
import ForumPost from './forumPost.model.js';
import ForumPostTopic from './forumPostTopic.model.js';
import ForumPostVersion from './ForumPostVersion.model.js';
import HistoryDocument from './historyDocument.model.js';
import Notification from './notification.model.js';
import Period from './period.model.js';
import QuizHistory from './quizHistory.model.js';
import QuizLeaderboard from './quizLeaderboard.model.js';
import QuizQuestion from './quizQuestion.model.js';
import QuizSet from './quizSet.model.js';
import QuizSetTopic from './quizSetTopic.model.js';
import SavePost from './savePost.model.js';
import Topic from './topic.model.js';
import User from './user.model.js';
import UserToken from './userToken.model.js';
import Image from './images.model.js';
// Export all models
export const models = {
  User,
  DocumentType,
  EmailVerification,
  ForumPost,
  ForumPostTopic,
  ForumPostVersion,
  HistoryDocument,
  Notification,
  Period,
  QuizHistory,
  QuizLeaderboard,
  QuizQuestion,
  QuizSet,
  QuizSetTopic,
  SavePost,
  Topic,
  UserToken,
  Image
};

// Define associations here if needed
// Example: User.hasMany(Post);

// Định nghĩa quan hệ n-n giữa QuizSet và Topic
QuizSet.belongsToMany(Topic, {
  through: QuizSetTopic,
  foreignKey: 'quiz_set_id',
  otherKey: 'topic_id',
  as: 'topics'
});
Topic.belongsToMany(QuizSet, {
  through: QuizSetTopic,
  foreignKey: 'topic_id',
  otherKey: 'quiz_set_id',
  as: 'quizSets'
});
