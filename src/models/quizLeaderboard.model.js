import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';
import User from './user.model.js';
import QuizSet from './quizSet.model.js';

const QuizLeaderboard = sequelize.define('QuizLeaderboard', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  quiz_id: {
    type: DataTypes.INTEGER,
    references: {
      model: QuizSet,
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  score: {
    type: DataTypes.INTEGER
  },
  is_finished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  finished_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'quiz_leaderboard',
  timestamps: false
});

QuizLeaderboard.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

QuizSet.hasMany(QuizLeaderboard, { foreignKey: 'quiz_id', onDelete: 'CASCADE' });
QuizLeaderboard.belongsTo(QuizSet, { foreignKey: 'quiz_id' });

export default QuizLeaderboard; 