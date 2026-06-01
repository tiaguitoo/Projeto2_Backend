const express = require("express")
const router = express.Router();

const { verifyAdmin } = require("../middlewares/authMiddleware");

const AdminController = require("../controllers/AdminController");

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