"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitAcBackgroundJob = exports.AcBackgroundJob = void 0;
const sequelize_1 = require("sequelize");
class AcBackgroundJob extends sequelize_1.Model {
}
exports.AcBackgroundJob = AcBackgroundJob;
const InitAcBackgroundJob = (sequelize) => {
    AcBackgroundJob.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        data: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false,
        },
        error: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false,
        },
        progress: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
        },
    }, {
        timestamps: true,
        underscored: true,
        tableName: "ac_background_jobs",
        sequelize,
    });
    return AcBackgroundJob;
};
exports.InitAcBackgroundJob = InitAcBackgroundJob;
