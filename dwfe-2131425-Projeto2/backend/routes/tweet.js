const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");

const TweetController = require("../controllers/TweetController");

// Tweet Operations
router.post("/tweets", verifyToken, TweetController.createTweet);
router.get("/tweets", verifyToken, TweetController.getFeed);
router.get("/tweets/:tweet_id", verifyToken, TweetController.getTweetDetails);
router.delete("/tweets/:tweet_id", verifyToken, TweetController.deleteTweet);

// Likes
router.post("/tweets/:tweet_id/like", verifyToken, TweetController.likeTweet);
router.delete("/tweets/:tweet_id/like", verifyToken, TweetController.unlikeTweet);

module.exports = router;