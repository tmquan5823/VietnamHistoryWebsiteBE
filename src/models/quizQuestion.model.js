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
  funfact: {
    type: DataTypes.TEXT
  },
  question_type: {
    type: DataTypes.ENUM('single_choice', 'multi_choice', 'text', 'range', 'reorder', 'info'),
    allowNull: false
  },
  info: {
    type: DataTypes.TEXT
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
  number: {
    type: DataTypes.INTEGER
  },
  action: {
    type: DataTypes.STRING,
    defaultValue: 'created'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  image_public_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'quiz_questions',
  timestamps: false
});

QuizSet.hasMany(QuizQuestion, { foreignKey: 'quiz_id', onDelete: 'CASCADE' });
QuizQuestion.belongsTo(QuizSet, { foreignKey: 'quiz_id' });

export default QuizQuestion; 