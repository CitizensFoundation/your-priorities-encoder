"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.models = void 0;
const acBackgroundJob_1 = require("./acBackgroundJob");
const Sequelize = require("sequelize");
const env = process.env.NODE_ENV || "development";
let sequelize;
if (process.env.DATABASE_URL && env === "production") {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        dialectOptions: {
            ssl: {
                rejectUnauthorized: false,
            },
        },
    });
}
else {
    const config = require(`${__dirname}/../../config/config.json`)[env];
    sequelize = new Sequelize(config.database, config.username, config.password, config);
}
exports.models = {
    sequelize,
    Sequelize,
    AcBackgroundJob: acBackgroundJob_1.InitAcBackgroundJob(sequelize)
};
