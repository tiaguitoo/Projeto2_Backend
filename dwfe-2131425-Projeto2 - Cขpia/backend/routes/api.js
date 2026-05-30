const express = require("express");
const router = express.Router();

const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

const AuthController = require("../controllers/AuthController");
const TweetController = require("../controllers/TweetController");
const UserController = require("../controllers/UserController");
const AdminController = require("../controllers/AdminController");

// --- PUBLIC ROUTES ---
router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);

// --- PROTECTED ROUTES (Logged users) ---

// Tweet Operations
router.post("/tweets", verifyToken, TweetController.createTweet);
router.get("/tweets", verifyToken, TweetController.getFeed);
router.get("/tweets/:tweet_id", verifyToken, TweetController.getTweetDetails);
router.delete("/tweets/:tweet_id", verifyToken, TweetController.deleteTweet);

// Likes
router.post("/tweets/:tweet_id/like", verifyToken, TweetController.likeTweet);
router.delete("/tweets/:tweet_id/like", verifyToken, TweetController.unlikeTweet);

// Follows & Profile
router.get("/users/suggestions", verifyToken, UserController.getSuggestions);
router.get("/users/profile/:username", verifyToken, UserController.getProfile);
router.get("/users/:user_id/followers", verifyToken, UserController.getFollowers);
router.get("/users/:user_id/following", verifyToken, UserController.getFollowing);
router.post("/users/:user_id/follow", verifyToken, UserController.followUser);
router.delete("/users/:user_id/follow", verifyToken, UserController.unfollowUser);

// --- ADMIN / BACKOFFICE ROUTES (Admins only) ---

// User Management
router.get("/admin/users", verifyAdmin, AdminController.listUsers);
router.put("/admin/users/:user_id", verifyAdmin, AdminController.updateUser);
router.delete("/admin/users/:user_id", verifyAdmin, AdminController.deleteUser);

// Tweet Management
router.get("/admin/tweets", verifyAdmin, AdminController.listTweets);
router.put("/admin/tweets/:tweet_id", verifyAdmin, AdminController.updateTweet);
router.delete("/admin/tweets/:tweet_id", verifyAdmin, AdminController.deleteTweet);
router.delete("/admin/tweets/:tweet_id/image", verifyAdmin, AdminController.deleteTweetImage);

module.exports = router;
