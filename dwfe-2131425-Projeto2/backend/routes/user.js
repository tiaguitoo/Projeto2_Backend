const express = require("express");
const router = express.Router();

const UserController = require("../controllers/UserController");

const { verifyToken } = require("../middlewares/authMiddleware");

// Follows & Profile
router.get("/users/suggestions", verifyToken, UserController.getSuggestions);
router.get("/users/profile/:username", verifyToken, UserController.getProfile);
router.get("/users/:user_id/followers", verifyToken, UserController.getFollowers);
router.get("/users/:user_id/following", verifyToken, UserController.getFollowing);
router.post("/users/:user_id/follow", verifyToken, UserController.followUser);
router.delete("/users/:user_id/follow", verifyToken, UserController.unfollowUser);

module.exports = router;