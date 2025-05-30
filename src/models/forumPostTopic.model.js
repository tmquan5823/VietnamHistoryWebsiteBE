import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';
import ForumPost from './forumPost.model.js';
import Topic from './topic.model.js';

const ForumPostTopic = sequelize.define('ForumPostTopic', {
  forum_post_id: {
    type: DataTypes.INTEGER,
    references: {
      model: ForumPost,
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
  tableName: 'forum_post_topics',
  timestamps: false
});

ForumPost.hasMany(ForumPostTopic, { foreignKey: 'forum_post_id', onDelete: 'CASCADE' });
ForumPostTopic.belongsTo(ForumPost, { foreignKey: 'forum_post_id' });

Topic.hasMany(ForumPostTopic, { foreignKey: 'topic_id', onDelete: 'CASCADE' });
ForumPostTopic.belongsTo(Topic, { foreignKey: 'topic_id' });

export default ForumPostTopic; 