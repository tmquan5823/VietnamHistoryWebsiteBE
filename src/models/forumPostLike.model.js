import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';
import User from './user.model.js';
import ForumPost from './forumPost.model.js';

const ForumPostLike = sequelize.define('ForumPostLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    references: {
      model: ForumPost,
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
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'forum_post_likes',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['post_id', 'user_id']
    }
  ]
});

export default ForumPostLike; 