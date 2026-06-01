const mysql = require("mysql2/promise");
const sequelize = require("../config/database");
const User = require("./User");
const Tweet = require("./Tweet");
const Like = require("./Like");
const Follow = require("./Follow");
require("dotenv").config();

// Define Model Associations

// 1. User <-> Tweet (One-to-Many)
User.hasMany(Tweet, { foreignKey: "user_id", as: "tweets", onDelete: "CASCADE" });
Tweet.belongsTo(User, { foreignKey: "user_id", as: "user" });

// 2. Tweet <-> Tweet (Self-association for replies/comments)
Tweet.hasMany(Tweet, { foreignKey: "reply_to_tweet_id", as: "replies", onDelete: "CASCADE" });
Tweet.belongsTo(Tweet, { foreignKey: "reply_to_tweet_id", as: "parentTweet" });

// 3. User <-> Tweet (Many-to-Many via Likes)
User.belongsToMany(Tweet, { through: Like, foreignKey: "user_id", otherKey: "tweet_id", as: "likedTweets" });
Tweet.belongsToMany(User, { through: Like, foreignKey: "tweet_id", otherKey: "user_id", as: "likingUsers" });
// Direct associations for easy querying
Tweet.hasMany(Like, { foreignKey: "tweet_id", as: "likes", onDelete: "CASCADE" });
Like.belongsTo(Tweet, { foreignKey: "tweet_id", as: "tweet" });
Like.belongsTo(User, { foreignKey: "user_id", as: "user" });

// 4. User <-> User (Many-to-Many via Follows)
User.belongsToMany(User, { through: Follow, as: "following", foreignKey: "follower_id", otherKey: "following_id" });
User.belongsToMany(User, { through: Follow, as: "followers", foreignKey: "following_id", otherKey: "follower_id" });
// Direct associations for easy querying
Follow.belongsTo(User, { foreignKey: "follower_id", as: "follower" });
Follow.belongsTo(User, { foreignKey: "following_id", as: "followingUser" });

const db = {
  sequelize,
  User,
  Tweet,
  Like,
  Follow
};

db.init = async () => {
  const schemaName = process.env.DB_SCHEMA || "clonetwitter";
  
  try {
    console.log(`Connecting to MySQL database server at ${process.env.DB_HOST || "localhost"}...`);
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "password"
    });

    console.log("MySQL connection successful. Creating/checking database schema...");
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${schemaName}\`;`);
    await connection.end();

    // Authenticate with Sequelize
    await sequelize.authenticate();
    console.log("Sequelize connected to MySQL successfully.");
  } catch (error) {
    console.warn("⚠️ MySQL connection failed. Switching to SQLite fallback...", error.message);
    sequelize.switchToSQLite();
  }

  try {
    // Sincronizar os modelos
    if (!sequelize.isSQLite()) {
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;", { raw: true });
    }
    
    // Sync models - creates or alters tables to match model definition
    await sequelize.sync({ alter: true });
    
    if (!sequelize.isSQLite()) {
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;", { raw: true });
    }
    console.log("Database models synchronized successfully.");

    // Seed initial data if database is empty
    await seedData();
  } catch (error) {
    console.error("Database synchronization failed:", error);
    throw error;
  }
};

async function seedData() {
  try {
    const userCount = await User.count();
    if (userCount > 0) {
      console.log("Database already contains data. Skipping seeding.");
      return;
    }

    console.log("Seeding default data...");
    
    const admin = await User.create({
      username: "admin",
      email: "admin@x.com",
      password_hash: "admin123",
      role: "admin"
    });

    const user1 = await User.create({
      username: "joao_silva",
      email: "joao@x.com",
      password_hash: "user123",
      role: "user"
    });

    const user2 = await User.create({
      username: "maria_reis",
      email: "maria@x.com",
      password_hash: "user123",
      role: "user"
    });

    const user3 = await User.create({
      username: "dev_tweets",
      email: "dev@x.com",
      password_hash: "user123",
      role: "user"
    });

    const tweet1 = await Tweet.create({
      user_id: user1.user_id,
      content: "Olá Mundo! Este é o meu primeiro tweet no clonetwitter. 🎉",
    });

    const tweet2 = await Tweet.create({
      user_id: user2.user_id,
      content: "Que dia espetacular para desenvolver em ReactJS e Node.js! 💻#coding #webdev",
    });

    const tweet3 = await Tweet.create({
      user_id: user3.user_id,
      content: "Alguém já testou o novo tema escuro deste clone do Twitter? Está fenomenal!",
      attachment_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop"
    });

    const reply1 = await Tweet.create({
      user_id: user1.user_id,
      reply_to_tweet_id: tweet3.tweet_id,
      content: "Eu testei! O contraste visual com as cores de acento está excelente.",
    });

    // Create follows
    // joao_silva (user1) follows maria_reis (user2) and dev_tweets (user3)
    await Follow.create({ follower_id: user1.user_id, following_id: user2.user_id });
    await Follow.create({ follower_id: user1.user_id, following_id: user3.user_id });

    // maria_reis (user2) follows joao_silva (user1)
    await Follow.create({ follower_id: user2.user_id, following_id: user1.user_id });

    // Create likes
    await Like.create({ user_id: user1.user_id, tweet_id: tweet2.tweet_id });
    await Like.create({ user_id: user2.user_id, tweet_id: tweet3.tweet_id });

    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

module.exports = db;
