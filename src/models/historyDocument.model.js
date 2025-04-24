import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connect.js';
import User from './user.model.js';
import DocumentType from './documentType.model.js';
import Period from './period.model.js';

const HistoryDocument = sequelize.define('HistoryDocument', {
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
  type_id: {
    type: DataTypes.INTEGER,
    references: {
      model: DocumentType,
      key: 'id'
    }
  },
  period_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Period,
      key: 'id'
    }
  },
  start_year: {
    type: DataTypes.INTEGER
  },
  end_year: {
    type: DataTypes.INTEGER
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'history_documents',
  timestamps: false
});

export default HistoryDocument; 