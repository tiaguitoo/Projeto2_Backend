const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Follow = sequelize.define("Follow", {
  follower_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  following_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  }
}, {
  timestamps: false,
  tableName: "follows"
});

module.exports = Follow;
