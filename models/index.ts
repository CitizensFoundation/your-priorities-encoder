import { InitAcBackgroundJob } from "./acBackgroundJob";

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
} else {
  const config = require(`${__dirname}/../../config/config.json`)[env];
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

export const models = {
  sequelize,
  Sequelize,
  AcBackgroundJob: InitAcBackgroundJob(sequelize)
};