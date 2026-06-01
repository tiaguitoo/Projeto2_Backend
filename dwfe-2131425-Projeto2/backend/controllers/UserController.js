const { User, Tweet, Follow, Like } = require("../models");
const { Op } = require("sequelize");

// 1. Follow a User
async function followUser(req, res) {
  try {
    const follower_id = req.user.user_id;
    const following_id = parseInt(req.params.user_id, 10);

    if (follower_id === following_id) {
      return res.status(400).json({ error: "You cannot follow yourself." });
    }

    const targetUser = await User.findByPk(following_id);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const existingFollow = await Follow.findOne({
      where: { follower_id, following_id }
    });

    if (existingFollow) {
      return res.status(400).json({ error: "You are already following this user." });
    }

    await Follow.create({ follower_id, following_id });
    return res.status(200).json({ message: "User followed successfully." });
  } catch (error) {
    console.error("Follow error:", error);
    return res.status(500).json({ error: "An error occurred while trying to follow this user." });
  }
}

// 2. Unfollow a User
async function unfollowUser(req, res) {
  try {
    const follower_id = req.user.user_id;
    const following_id = parseInt(req.params.user_id, 10);

    const follow = await Follow.findOne({
      where: { follower_id, following_id }
    });

    if (!follow) {
      return res.status(400).json({ error: "You are not following this user." });
    }

    await follow.destroy();
    return res.status(200).json({ message: "User unfollowed successfully." });
  } catch (error) {
    console.error("Unfollow error:", error);
    return res.status(500).json({ error: "An error occurred while trying to unfollow this user." });
  }
}

// 3. Get User Profile and tweets
async function getProfile(req, res) {
  try {
    const { username } = req.params;
    const loggedUserId = req.user.user_id;

    const user = await User.findOne({
      where: { username },
      attributes: ["user_id", "username", "email", "role", "created_at"]
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const userId = user.user_id;

    // Get followers and following counts
    const followersCount = await Follow.count({ where: { following_id: userId } });
    const followingCount = await Follow.count({ where: { follower_id: userId } });
    const tweetsCount = await Tweet.count({ where: { user_id: userId } });

    // Check if current user is following this user
    const isFollowing = await Follow.findOne({
      where: { follower_id: loggedUserId, following_id: userId }
    }) !== null;

    // Fetch user's tweets and replies
    const tweets = await Tweet.findAll({
      where: { user_id: userId },
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
        repliesCount: repliesList.length,
        isLiked: likesList.some(like => like.user_id === loggedUserId)
      };
    });

    return res.status(200).json({
      profile: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        followersCount,
        followingCount,
        tweetsCount,
        isFollowing
      },
      tweets: formattedTweets
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ error: "An error occurred while fetching profile." });
  }
}

// 4. Get suggestions of who to follow
async function getSuggestions(req, res) {
  try {
    const loggedUserId = req.user.user_id;

    // Fetch who current user follows
    const follows = await Follow.findAll({
      where: { follower_id: loggedUserId }
    });
    const followedIds = follows.map(f => f.following_id);

    // Users to exclude: followed ones and self
    const excludeIds = [...followedIds, loggedUserId];

    // Suggest up to 5 users
    const suggestions = await User.findAll({
      where: {
        user_id: {
          [Op.notIn]: excludeIds
        }
      },
      limit: 5,
      attributes: ["user_id", "username"]
    });

    return res.status(200).json(suggestions);
  } catch (error) {
    console.error("Get suggestions error:", error);
    return res.status(500).json({ error: "An error occurred while fetching suggestions." });
  }
}
// 5. Get Followers
async function getFollowers(req, res) {
  try {
    const { user_id } = req.params;
    
    const follows = await Follow.findAll({
      where: { following_id: user_id }
    });
    
    if (!follows.length) return res.status(200).json([]);
    
    const followerIds = follows.map(f => f.follower_id);
    const users = await User.findAll({
      where: { user_id: followerIds },
      attributes: ["user_id", "username"]
    });
    
    return res.status(200).json(users);
  } catch (error) {
    console.error("Get followers error:", error);
    return res.status(500).json({ error: "Error fetching followers." });
  }
}

// 6. Get Following
async function getFollowing(req, res) {
  try {
    const { user_id } = req.params;
    
    const follows = await Follow.findAll({
      where: { follower_id: user_id }
    });
    
    if (!follows.length) return res.status(200).json([]);
    
    const followingIds = follows.map(f => f.following_id);
    const users = await User.findAll({
      where: { user_id: followingIds },
      attributes: ["user_id", "username"]
    });
    
    return res.status(200).json(users);
  } catch (error) {
    console.error("Get following error:", error);
    return res.status(500).json({ error: "Error fetching following." });
  }
}

module.exports = {
  followUser,
  unfollowUser,
  getProfile,
  getSuggestions,
  getFollowers,
  getFollowing
};
