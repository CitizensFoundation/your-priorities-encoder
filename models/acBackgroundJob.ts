import {
  Sequelize,
  Model,
  ModelDefined,
  DataTypes,
  HasManyGetAssociationsMixin,
  HasManyAddAssociationMixin,
  HasManyHasAssociationMixin,
  Association,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  Optional,
} from "sequelize";

// Some attributes are optional in `User.build` and `User.create` calls
interface AcBackgroundJobCreationAttributes extends Optional<AcBackgroundJobAttributes, "id"> {}

export class AcBackgroundJob
  extends Model<AcBackgroundJobAttributes, AcBackgroundJobCreationAttributes>
  implements AcBackgroundJobAttributes {
  public id!: number;
  public data!: object;
  public error!: string;
  public progress!: number;

  // timestamps!
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

export const InitAcBackgroundJob = (sequelize: Sequelize) => {
  AcBackgroundJob.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      progress: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      underscored: true,
      tableName: "ac_background_jobs",
      sequelize,
    }
  );

  return AcBackgroundJob;
};
