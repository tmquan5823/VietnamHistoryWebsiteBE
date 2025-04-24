import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';
import QuizSet from './quizSet.model.js';

const QuizQuestion = sequelize.define('QuizQuestion', {
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
  question: {
    type: DataTypes.TEXT
  },
  question_type: {
    type: DataTypes.ENUM('single_choice', 'multiple_choice', 'text', 'range'),
    allowNull: false
  },
  image_url: {
    type: DataTypes.STRING(255)
  },
  correct_answers: {
    type: DataTypes.TEXT
  },
  options: {
    type: DataTypes.TEXT
  },
  expected_answer: {
    type: DataTypes.TEXT
  },
  min_value: {
    type: DataTypes.INTEGER
  },
  max_value: {
    type: DataTypes.INTEGER
  },
  time_limit_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  max_score: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'quiz_questions',
  timestamps: false
});

export default QuizQuestion; 