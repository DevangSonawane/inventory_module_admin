import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const BusinessPartner = sequelize.define('business_partner', {
  partner_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  partner_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Business partner name'
  },
  partner_type: {
    type: DataTypes.ENUM('VENDOR', 'SUPPLIER', 'CUSTOMER'),
    allowNull: false,
    defaultValue: 'VENDOR',
    comment: 'Type of business partner'
  },
  contact_person: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Contact person name'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Email address'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Phone number'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Address'
  },
  org_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Organization ID for multi-tenant support'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  tableName: 'business_partners',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['partner_name']
    },
    {
      fields: ['partner_type']
    },
    {
      fields: ['org_id']
    },
    {
      fields: ['is_active']
    }
  ]
});

export default BusinessPartner;



