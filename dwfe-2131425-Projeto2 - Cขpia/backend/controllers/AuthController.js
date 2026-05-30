const jwt = require("jsonwebtoken");
const { User } = require("../models");
require("dotenv").config();

function generateAccessToken(user) {
  return jwt.sign(
    { 
      user_id: user.user_id, 
      username: user.username, 
      email: user.email, 
      role: user.role 
    },
    process.env.TOKEN_SECRET,
    { expiresIn: "24h" }
  );
}

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required." });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 4 || trimmedUsername.length > 15) {
      return res.status(400).json({ error: "Username must be between 4 and 15 characters." });
    }

    // Check if username is already taken
    const existingUserByUsername = await User.findOne({ where: { username: trimmedUsername } });
    if (existingUserByUsername) {
      return res.status(409).json({ error: "Username is already taken." });
    }

    // Check if email already exists
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return res.status(409).json({ error: "Email is already registered." });
    }

    // Create user (password is hashed in beforeCreate hook)
    const newUser = await User.create({
      username: trimmedUsername,
      email,
      password_hash: password,
      role: "user"
    });

    const token = generateAccessToken(newUser);

    return res.status(201).json({
      message: "User registered successfully.",
      token,
      user: {
        user_id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(", ") });
    }
    return res.status(500).json({ error: "An error occurred during registration." });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const searchCredential = username.trim();

    // Check if logging in with email or username
    let user;
    if (searchCredential.includes("@")) {
      user = await User.findOne({ where: { email: searchCredential } });
    } else {
      user = await User.findOne({ where: { username: searchCredential } });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid username/email or password." });
    }

    // Verify password using instance method
    const isPasswordValid = await user.validPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username/email or password." });
    }

    // Generate token
    const token = generateAccessToken(user);

    return res.status(200).json({
      message: "Authentication successful.",
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "An error occurred during authentication." });
  }
}

module.exports = {
  register,
  login
};