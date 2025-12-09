import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PurchaseRequestItem = sequelize.define('purchase_request_item', {
  item_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pr_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Reference to purchase request'
  },
  material_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Reference to material'
  },
  requested_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Requested quantity'
  },
  uom: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'PIECE(S)',
    comment: 'Unit of measure'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional remarks'
  },
}, {
  tableName: 'purchase_request_items',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['pr_id']
    },
    {
      fields: ['material_id']
    }
  ]
});

export default PurchaseRequestItem;



