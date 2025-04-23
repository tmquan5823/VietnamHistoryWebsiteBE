import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';

const DocumentType = sequelize.define('DocumentType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  }
}, {
  tableName: 'document_types',
  timestamps: false
});

export default DocumentType; 