// controllers/authController.js
// Registration and login. Passwords are hashed by the User model's pre-save hook
// (bcrypt); this controller signs and returns a JWT on success.

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendOTP } = require("../utils/sendEmail");

// Sign a JWT carrying the user id and role.
const signToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn });
};

// Shape the user object returned to clients (never leak the password hash).
const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || "",
  currentDevice: user.currentDevice || "",
  addresses: user.addresses || [],
  createdAt: user.createdAt,
});

/**
 * POST /api/auth/register
 * Body: { name, email, password, role?, phone, currentDevice }
 * Creates an unverified user and sends an OTP email.
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, currentDevice } = req.body;

    // Strict validation.
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Name, email and password are required" });
    }
    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "An account with this email already exists" });
    }

    // Only allow "Admin" if the requester is already an authenticated admin.
    // Public self-registration is always forced to "Customer".
    const safeRole =
      role === "Admin" && req.user && req.user.role === "Admin" ? "Admin" : "Customer";

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 15 * 60 * 1000; // 15 mins expiry

    // Password hashing happens in the User pre-save hook.
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      role: safeRole,
      isVerified: safeRole === "Admin", // Admins are auto-verified
      otpCode: otp,
      otpExpires,
      phone: phone ? String(phone).trim() : "",
      currentDevice: currentDevice ? String(currentDevice).trim() : "",
    });

    // Send OTP email (only for customers)
    let emailSent = true;
    if (safeRole === "Customer") {
      try {
        await sendOTP(normalizedEmail, otp);
      } catch (mailError) {
        console.error(`Failed to send OTP email: ${mailError.message}`);
        emailSent = false;
      }
    }

    return res.status(201).json({
      success: true,
      message: safeRole === "Customer" 
        ? (emailSent ? "Verification code sent to your email. Please verify to log in." : "Account registered, but verification email failed to send. Please request a new code or contact support.")
        : "Admin account registered successfully.",
      email: normalizedEmail,
      user: publicUser(user),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }
    console.error(`register error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Registration failed" });
  }
};

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 * Verifies email verification code and logs customer in.
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Account is already verified" });
    }

    if (user.otpCode !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Verification code has expired. Please request a new one." });
    }

    // Set verified
    user.isVerified = true;
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error(`verifyOTP error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Verification failed" });
  }
};

/**
 * POST /api/auth/resend-otp
 * Body: { email }
 * Resends verification code to customer email.
 */
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Account is already verified" });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    try {
      await sendOTP(normalizedEmail, otp);
    } catch (mailError) {
      console.error(`Failed to resend OTP email: ${mailError.message}`);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please verify your SMTP server configuration or try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "New verification code sent to your email",
    });
  } catch (error) {
    console.error(`resendOTP error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to resend code" });
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Verifies credentials and returns a token (checks verification status).
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Password is select:false in the schema — request it explicitly.
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended / blocked. Please contact support.",
      });
    }

    // Customer accounts must be verified
    if (user.role === "Customer" && !user.isVerified) {
      return res.status(403).json({
        success: false,
        isVerified: false,
        message: "Please verify your email address to log in.",
        email: normalizedEmail,
      });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error(`login error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};

/**
 * GET /api/auth/me  (protected)
 * Returns the currently authenticated user.
 */
const getProfile = async (req, res) => {
  return res.status(200).json({ success: true, user: publicUser(req.user) });
};

module.exports = { register, verifyOTP, resendOTP, login, getProfile };
