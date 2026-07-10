// routes/authRoutes.js
// Authentication endpoints: register, login, and current-user profile.

const express = require("express");
const router = express.Router();

const { register, login, getProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Public
router.post("/register", register);
router.post("/login", login);

// Protected
router.get("/me", protect, getProfile);

module.exports = router;
