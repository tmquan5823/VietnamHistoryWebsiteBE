import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';
import User from './user.model.js';
import ForumPost from './forumPost.model.js';

const ForumPostVersion = sequelize.define('ForumPostVersion', {
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
    },
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  editor_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    },
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'forum_post_versions',
  timestamps: false
});

ForumPostVersion.belongsTo(ForumPost, { foreignKey: 'post_id', as: 'post' });
ForumPostVersion.belongsTo(User, { foreignKey: 'editor_id', as: 'editor' });

export default ForumPostVersion;
