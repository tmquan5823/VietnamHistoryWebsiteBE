import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';
import QuizSet from './quizSet.model.js';
import Topic from './topic.model.js';

const QuizSetTopic = sequelize.define('QuizSetTopic', {
  quiz_set_id: {
    type: DataTypes.INTEGER,
    references: {
      model: QuizSet,
      key: 'id'
    }
  },
  topic_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Topic,
      key: 'id'
    }
  }
}, {
  tableName: 'quiz_set_topics',
  timestamps: false
});

QuizSet.hasMany(QuizSetTopic, { foreignKey: 'quiz_set_id', onDelete: 'CASCADE' });
QuizSetTopic.belongsTo(QuizSet, { foreignKey: 'quiz_set_id' });

Topic.hasMany(QuizSetTopic, { foreignKey: 'topic_id', onDelete: 'CASCADE' });
QuizSetTopic.belongsTo(Topic, { foreignKey: 'topic_id' });

export default QuizSetTopic; 