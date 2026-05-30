const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Tweet = sequelize.define("Tweet", {
  tweet_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reply_to_tweet_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  content: {
    type: DataTypes.STRING(280),
    allowNull: false,
    validate: {
      len: {
        args: [1, 280],
        msg: "Tweet content must be between 1 and 280 characters."
      }
    }
  },
  attachment_url: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
  tableName: "tweets"
});

module.exports = Tweet;
