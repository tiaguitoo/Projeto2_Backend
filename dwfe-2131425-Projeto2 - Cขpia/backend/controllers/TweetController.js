const { Tweet, User, Like, Follow } = require("../models");

// 1. Create a Tweet or Reply
async function createTweet(req, res) {
  try {
    const { content, attachment_url, reply_to_tweet_id } = req.body;
    const user_id = req.user.user_id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Tweet content cannot be empty." });
    }

    if (content.length > 280) {
      return res.status(400).json({ error: "Tweet content exceeds 280 characters." });
    }

    // Check if parent reply tweet exists
    if (reply_to_tweet_id) {
      const parentTweet = await Tweet.findByPk(reply_to_tweet_id);
      if (!parentTweet) {
        return res.status(404).json({ error: "The tweet you are replying to does not exist." });
      }
    }

    const tweet = await Tweet.create({
      user_id,
      content,
      attachment_url: attachment_url || null,
      reply_to_tweet_id: reply_to_tweet_id || null
    });

    // Fetch the created tweet with details to return
    const createdTweet = await Tweet.findByPk(tweet.tweet_id, {
      include: [
        { model: User, as: "user", attributes: ["user_id", "username"] }
      ]
    });

    const formatted = {
      ...createdTweet.toJSON(),
      likesCount: 0,
      repliesCount: 0,
      isLiked: false
    };

    return res.status(201).json(formatted);
  } catch (error) {
    console.error("Create tweet error:", error);
    return res.status(500).json({ error: "An error occurred while publishing the tweet." });
  }
}

// 2. Get Feed (Global or Following)
async function getFeed(req, res) {
  try {
    const loggedUserId = req.user.user_id;
    const { type, feed } = req.query; // 'global' or 'following'
    const feedType = type || feed;

    let whereClause = { reply_to_tweet_id: null }; // Only main tweets in main feeds, no replies

    if (feedType === "following") {
      // Find following IDs
      const follows = await Follow.findAll({
        where: { follower_id: loggedUserId }
      });
      const followingIds = follows.map(f => f.following_id);
      
      if (followingIds.length === 0) {
        return res.status(200).json([]);
      }
      
      whereClause.user_id = followingIds;
    }

    const tweets = await Tweet.findAll({
      where: whereClause,
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

    return res.status(200).json(formattedTweets);
  } catch (error) {
    console.error("Get feed error:", error);
    return res.status(500).json({ error: "An error occurred while fetching the feed." });
  }
}

// 3. Get Tweet Details with Replies
async function getTweetDetails(req, res) {
  try {
    const { tweet_id } = req.params;
    const loggedUserId = req.user.user_id;

    const tweet = await Tweet.findByPk(tweet_id, {
      include: [
        { model: User, as: "user", attributes: ["user_id", "username"] },
        { model: Like, as: "likes", attributes: ["user_id"] }
      ]
    });

    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found." });
    }

    const replies = await Tweet.findAll({
      where: { reply_to_tweet_id: tweet_id },
      order: [["created_at", "ASC"]],
      include: [
        { model: User, as: "user", attributes: ["user_id", "username"] },
        { model: Like, as: "likes", attributes: ["user_id"] },
        { model: Tweet, as: "replies", attributes: ["tweet_id"] }
      ]
    });

    const tweetJson = tweet.toJSON();
    const mainLikes = tweetJson.likes || [];

    const formattedTweet = {
      tweet_id: tweetJson.tweet_id,
      user_id: tweetJson.user_id,
      reply_to_tweet_id: tweetJson.reply_to_tweet_id,
      content: tweetJson.content,
      attachment_url: tweetJson.attachment_url,
      created_at: tweetJson.created_at,
      user: tweetJson.user,
      likesCount: mainLikes.length,
      repliesCount: replies.length,
      isLiked: mainLikes.some(like => like.user_id === loggedUserId)
    };

    const formattedReplies = replies.map(reply => {
      const replyJson = reply.toJSON();
      const replyLikes = replyJson.likes || [];
      const replyReplies = replyJson.replies || [];

      return {
        tweet_id: replyJson.tweet_id,
        user_id: replyJson.user_id,
        reply_to_tweet_id: replyJson.reply_to_tweet_id,
        content: replyJson.content,
        attachment_url: replyJson.attachment_url,
        created_at: replyJson.created_at,
        user: replyJson.user,
        likesCount: replyLikes.length,
        repliesCount: replyReplies.length,
        isLiked: replyLikes.some(like => like.user_id === loggedUserId)
      };
    });

    return res.status(200).json({
      tweet: formattedTweet,
      replies: formattedReplies
    });
  } catch (error) {
    console.error("Get tweet details error:", error);
    return res.status(500).json({ error: "An error occurred while fetching tweet details." });
  }
}

// 4. Like a Tweet
async function likeTweet(req, res) {
  try {
    const { tweet_id } = req.params;
    const user_id = req.user.user_id;

    const tweet = await Tweet.findByPk(tweet_id);
    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found." });
    }

    const existingLike = await Like.findOne({
      where: { user_id, tweet_id }
    });

    if (existingLike) {
      return res.status(400).json({ error: "You have already liked this tweet." });
    }

    await Like.create({ user_id, tweet_id });
    return res.status(200).json({ message: "Tweet liked." });
  } catch (error) {
    console.error("Like tweet error:", error);
    return res.status(500).json({ error: "An error occurred while liking the tweet." });
  }
}

// 5. Unlike a Tweet
async function unlikeTweet(req, res) {
  try {
    const { tweet_id } = req.params;
    const user_id = req.user.user_id;

    const like = await Like.findOne({
      where: { user_id, tweet_id }
    });

    if (!like) {
      return res.status(400).json({ error: "You have not liked this tweet." });
    }

    await like.destroy();
    return res.status(200).json({ message: "Tweet unliked." });
  } catch (error) {
    console.error("Unlike tweet error:", error);
    return res.status(500).json({ error: "An error occurred while unliking the tweet." });
  }
}

// 6. Delete a Tweet
async function deleteTweet(req, res) {
  try {
    const { tweet_id } = req.params;
    const { user_id, role } = req.user;

    const tweet = await Tweet.findByPk(tweet_id);
    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found." });
    }

    // Permission: creator or admin
    if (tweet.user_id !== user_id && role !== "admin") {
      return res.status(403).json({ error: "Access denied. You do not have permission to delete this tweet." });
    }

    await tweet.destroy();
    return res.status(200).json({ message: "Tweet deleted successfully." });
  } catch (error) {
    console.error("Delete tweet error:", error);
    return res.status(500).json({ error: "An error occurred while deleting the tweet." });
  }
}

module.exports = {
  createTweet,
  getFeed,
  getTweetDetails,
  likeTweet,
  unlikeTweet,
  deleteTweet
};
