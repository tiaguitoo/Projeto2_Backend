const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
require("dotenv").config();

const apiRouter = require("./routes/api");

const app = express();

// Middlewares
app.use(cors());
app.use(logger("dev"));
app.use(express.json({ limit: "10mb" })); // Support base64 image uploads in tweet content
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());

// API Routes
app.use("/api", apiRouter);

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve Frontend static files in production
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// SPA Catch-All: Route non-API GET requests to the React frontend
app.use((req, res, next) => {
  // If it's an API request that 404'd, don't return index.html
  if (req.path.startsWith("/api")) {
    return next();
  }
  // Only handle GET requests for SPA html loading
  if (req.method !== "GET") {
    return next();
  }
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"), (err) => {
    if (err) {
      // Fallback if frontend is not built yet (development mode)
      res.status(404).json({ error: "API endpoint not found. Build the frontend or run frontend dev server." });
    }
  });
});

// 404 API Handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});

// General Error Handler
app.use((err, req, res, next) => {
  console.error("Express Error Handler:", err);
  res.status(err.status || 500).json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {}
  });
});

module.exports = app;
