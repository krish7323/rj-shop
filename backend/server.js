// server.js
// Entry point: configures Express, applies cors + JSON parsing, connects to MongoDB,
// and exposes a health-check test endpoint.

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Route modules
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const { razorpayWebhook } = require("./controllers/orderController");

// --- Connect to the database first ---
connectDB();

const app = express();

// --- Razorpay webhook (MUST be before express.json so we get the raw body
// for HMAC signature verification) ---
app.post(
  "/api/orders/webhook/razorpay",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

// --- Core middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Test / health-check endpoint ---
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RJ Shop API is running 🚀",
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get("/", (req, res) => {
  res.status(200).send("RJ Shop backend is live.");
});

// --- API routes ---
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// --- Centralized error handler ---
app.use((err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// --- Start server ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ RJ Shop server running on port ${PORT}`);
});

module.exports = app;
