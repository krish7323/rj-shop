// middleware/auth.js
// JWT authentication + role-based authorization for RJ Shop.
// - protect: verifies a Bearer token, loads the user, attaches it to req.user.
// - adminCheck: allows the request through only if req.user.role === "Admin".

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Verify a JWT from the Authorization header (Bearer scheme).
 * On success attaches the authenticated user document to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization || "";

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized: no token provided" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res
        .status(500)
        .json({ success: false, message: "Server misconfiguration: JWT_SECRET missing" });
    }

    // Throws if expired/invalid — caught below.
    const decoded = jwt.verify(token, secret);

    // Load the user fresh so role/permission changes take effect immediately.
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized: user no longer exists" });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired, please log in again" });
    }
    return res.status(401).json({ success: false, message: "Not authorized: invalid token" });
  }
};

/**
 * Restrict a route to Admin users. Must run AFTER protect.
 */
const adminCheck = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized: authentication required" });
  }

  if (req.user.role !== "Admin") {
    return res
      .status(403)
      .json({ success: false, message: "Forbidden: admin access only" });
  }

  return next();
};

module.exports = { protect, adminCheck };
