import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';
import QuizSet from './quizSet.model.js';
import QuizQuestion from './quizQuestion.model.js';

const QuizHistory = sequelize.define('QuizHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quiz_set_id: {
    type: DataTypes.INTEGER,
    references: {
      model: QuizSet,
      key: 'id'
    },
    allowNull: false
  },
  question_id: {
    type: DataTypes.INTEGER,
    references: {
      model: QuizQuestion,
      key: 'id'
    },
    allowNull: false
  },
  user_answer: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  time_taken: {
    type: DataTypes.FLOAT
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'quiz_histories',
  timestamps: false
});

QuizHistory.belongsTo(QuizQuestion, {
  foreignKey: 'question_id',
  as: 'question'
});

QuizSet.hasMany(QuizHistory, { foreignKey: 'quiz_set_id', onDelete: 'CASCADE' });
QuizHistory.belongsTo(QuizSet, { foreignKey: 'quiz_set_id' });

export default QuizHistory;
