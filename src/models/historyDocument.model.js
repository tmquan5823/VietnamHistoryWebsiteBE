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
  image: {
    type: DataTypes.STRING(255)
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
  key_words: {
    type: DataTypes.TEXT  // hoặc STRING(500) nếu bạn muốn giới hạn độ dài
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
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
  tableName: 'history_documents',
  timestamps: false
});

HistoryDocument.belongsTo(Period, { foreignKey: 'period_id' });
HistoryDocument.belongsTo(DocumentType, { foreignKey: 'type_id' });

export default HistoryDocument; 