import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';
import User from './user.model.js';

const Image = sequelize.define('Image', {
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
  url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  public_id: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  original: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'images',
  timestamps: false
});

Image.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Image, { foreignKey: 'user_id' });

export default Image;
