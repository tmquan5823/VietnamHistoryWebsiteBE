import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';
import User from './user.model.js';
import ForumPost from './forumPost.model.js';

const SavePost = sequelize.define('SavePost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ForumPost,
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'save_posts',
  timestamps: false
});

SavePost.belongsTo(User, { foreignKey: 'user_id' });
SavePost.belongsTo(ForumPost, { foreignKey: 'post_id' });
User.hasMany(SavePost, { foreignKey: 'user_id' });
ForumPost.hasMany(SavePost, { foreignKey: 'post_id' });

export default SavePost;
