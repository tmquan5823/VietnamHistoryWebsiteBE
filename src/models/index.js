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
import Topic from './topic.model.js';
import QuizSetTopic from './quizSetTopic.model.js';
import ForumPostTopic from './forumPostTopic.model.js';
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
  UserToken,
  Topic,
  QuizSetTopic,
  ForumPostTopic
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
