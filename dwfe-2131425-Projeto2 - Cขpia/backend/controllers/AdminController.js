const { User, Tweet, Like, Follow } = require("../models");

// 1. List all users (Backoffice)
async function listUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: ["user_id", "username", "email", "role", "created_at"],
      order: [["created_at", "DESC"]]
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error("Admin list users error:", error);
    return res.status(500).json({ error: "An error occurred while listing users." });
  }
}

// 2. Update a user (Backoffice)
async function updateUser(req, res) {
  try {
    const { user_id } = req.params;
    const { username, email, role, password } = req.body;

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (username) {
      const trimmedUsername = username.trim();
      if (trimmedUsername.length < 4 || trimmedUsername.length > 15) {
        return res.status(400).json({ error: "Username must be between 4 and 15 characters." });
      }
      
      const existingUser = await User.findOne({ where: { username: trimmedUsername } });
      if (existingUser && existingUser.user_id !== parseInt(user_id, 10)) {
        return res.status(409).json({ error: "Username is already taken." });
      }
      user.username = trimmedUsername;
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail && existingEmail.user_id !== parseInt(user_id, 10)) {
        return res.status(409).json({ error: "Email is already registered." });
      }
      user.email = email;
    }

    if (role) {
      if (role !== "user" && role !== "admin") {
        return res.status(400).json({ error: "Invalid role. Must be 'user' or 'admin'." });
      }
      user.role = role;
    }

    if (password && password.trim().length > 0) {
      user.password_hash = password; // Seta nova password (o hook handles hashing)
    }

    await user.save();

    return res.status(200).json({
      message: "User updated successfully.",
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Admin update user error:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(", ") });
    }
    return res.status(500).json({ error: "An error occurred while updating the user." });
  }
}

// 3. Delete a user (Backoffice)
async function deleteUser(req, res) {
  try {
    const { user_id } = req.params;
    
    // Prevent self-deletion
    if (parseInt(user_id, 10) === req.user.user_id) {
      return res.status(400).json({ error: "You cannot delete your own admin account." });
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Manually cleanup related tables to ensure SQLite/MySQL consistency
    await Like.destroy({ where: { user_id } });
    await Follow.destroy({ where: { follower_id: user_id } });
    await Follow.destroy({ where: { following_id: user_id } });

    await user.destroy();
    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return res.status(500).json({ error: "An error occurred while deleting the user." });
  }
}

// 4. List all tweets (Backoffice)
async function listTweets(req, res) {
  try {
    const tweets = await Tweet.findAll({
      order: [["created_at", "DESC"]],
      include: [
        { model: User, as: "user", attributes: ["user_id", "username"] },
        { model: Like, as: "likes", attributes: ["user_id"] },
        { model: Tweet, as: "replies", attributes: ["tweet_id"] }
      ]
    });

    const formattedTweets = tweets.map(tweet => {
      const tweetJson = tweet.toJSON();
      const likesList = tweetJson.likes || [];
      const repliesList = tweetJson.replies || [];

      return {
        tweet_id: tweetJson.tweet_id,
        user_id: tweetJson.user_id,
        reply_to_tweet_id: tweetJson.reply_to_tweet_id,
        content: tweetJson.content,
        attachment_url: tweetJson.attachment_url,
        created_at: tweetJson.created_at,
        user: tweetJson.user,
        likesCount: likesList.length,
        repliesCount: repliesList.length
      };
    });

    return res.status(200).json(formattedTweets);
  } catch (error) {
    console.error("Admin list tweets error:", error);
    return res.status(500).json({ error: "An error occurred while listing tweets." });
  }
}

// 5. Update a tweet's content (Backoffice)
async function updateTweet(req, res) {
  try {
    const { tweet_id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Tweet content cannot be empty." });
    }

    const tweet = await Tweet.findByPk(tweet_id);
    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found." });
    }

    tweet.content = content;
    await tweet.save();

    return res.status(200).json({ message: "Tweet updated successfully.", tweet });
  } catch (error) {
    console.error("Admin update tweet error:", error);
    return res.status(500).json({ error: "An error occurred while updating the tweet." });
  }
}

// 6. Delete any tweet (Backoffice)
async function deleteTweet(req, res) {
  try {
    const { tweet_id } = req.params;

    const tweet = await Tweet.findByPk(tweet_id);
    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found." });
    }

    await tweet.destroy();
    return res.status(200).json({ message: "Tweet deleted successfully." });
  } catch (error) {
    console.error("Admin delete tweet error:", error);
    return res.status(500).json({ error: "An error occurred while deleting the tweet." });
  }
}
// 7. Delete tweet image (Backoffice)
async function deleteTweetImage(req, res) {
  try {
    const { tweet_id } = req.params;

    const tweet = await Tweet.findByPk(tweet_id);
    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found." });
    }

    tweet.attachment_url = null;
    await tweet.save();

    return res.status(200).json({ message: "Tweet image removed successfully.", tweet });
  } catch (error) {
    console.error("Admin delete tweet image error:", error);
    return res.status(500).json({ error: "An error occurred while removing the tweet image." });
  }
}

module.exports = {
  listUsers,
  updateUser,
  deleteUser,
  listTweets,
  updateTweet,
  deleteTweet,
  deleteTweetImage
};
