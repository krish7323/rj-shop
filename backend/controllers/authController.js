// controllers/authController.js
// Registration and login. Passwords are hashed by the User model's pre-save hook
// (bcrypt); this controller signs and returns a JWT on success.

const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
  addresses: user.addresses || [],
  createdAt: user.createdAt,
});

/**
 * POST /api/auth/register
 * Body: { name, email, password, role? }
 * Creates a customer (or admin if explicitly allowed) and returns a token.
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

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

    // Password hashing happens in the User pre-save hook.
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      role: safeRole,
    });

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    // Handle mongoose validation + duplicate-key errors gracefully.
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
 * POST /api/auth/login
 * Body: { email, password }
 * Verifies credentials and returns a token.
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

module.exports = { register, login, getProfile };
