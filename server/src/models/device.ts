import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

export interface DeviceAttributes {
  id: number;
  name: string;
  type: string;
  location: string;
  waste_point_id?: number;
  device_token?: string;
  organizationId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class Device extends Model<DeviceAttributes> implements DeviceAttributes {
  public id!: number;
  public name!: string;
  public type!: string;
  public location!: string;
  public waste_point_id?: number;
  public device_token?: string;
  public organizationId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Device.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    waste_point_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'waste_point',
        key: 'id',
      },
    },
    device_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'organization',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'device',
    timestamps: true,
  }
);

export default Device; 