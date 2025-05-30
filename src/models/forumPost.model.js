import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';
import User from './user.model.js';

const ForumPost = sequelize.define('ForumPost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255)
  },
  content: {
    type: DataTypes.TEXT
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('local', 'pending', 'approved', 'inactive', 'rejected', 'needs_review'),
    defaultValue: 'local'
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
  tableName: 'forum_posts',
  timestamps: false
});

ForumPost.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

export default ForumPost; 