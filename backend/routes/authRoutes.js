// routes/authRoutes.js
// Authentication endpoints: register, login, and current-user profile.

const express = require("express");
const router = express.Router();

const { register, verifyOTP, resendOTP, login, getProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Public
router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", login);

// Protected
router.get("/me", protect, getProfile);

module.exports = router;
