const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Like = sequelize.define("Like", {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  tweet_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  }
}, {
  timestamps: false,
  tableName: "likes"
});

module.exports = Like;
