const { Sequelize } = require("sequelize");
require("dotenv").config();

let sequelizeInstance = new Sequelize(
  process.env.DB_SCHEMA || "clonetwitter",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "password",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 5000, // Fast timeout for quick fallback
      idle: 10000
    }
  }
);

let isUsingSQLite = false;

function switchToSQLite() {
  if (isUsingSQLite) return;
  console.log("⚠️ MySQL connection failed or not available. Falling back to local SQLite database...");
  sequelizeInstance = new Sequelize({
    dialect: "sqlite",
    storage: "./clonetwitter.sqlite",
    logging: false
  });
  isUsingSQLite = true;
}

// Proxy to delegate all Sequelize calls dynamically to the current instance
const dbProxy = new Proxy({}, {
  get: function (target, prop) {
    if (prop === "switchToSQLite") {
      return switchToSQLite;
    }
    if (prop === "isSQLite") {
      return () => isUsingSQLite;
    }
    const val = sequelizeInstance[prop];
    if (typeof val === "function") {
      return val.bind(sequelizeInstance);
    }
    return val;
  },
  set: function (target, prop, value) {
    sequelizeInstance[prop] = value;
    return true;
  }
});

module.exports = dbProxy;
