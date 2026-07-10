// routes/orderRoutes.js
// Order endpoints. Customers checkout and track; admins update status and view all.
//
// NOTE: static paths (/my-orders, /all) are declared before the parameterized
// /:id/status route so they are never shadowed by a param match.

const express = require("express");
const router = express.Router();

const {
  createOrder,
  verifyRazorpayPayment,
  updateDeliveryStatus,
  getUserOrders,
  getAllOrders,
} = require("../controllers/orderController");
const { protect, adminCheck } = require("../middleware/auth");

// Secure checkout (any authenticated customer)
router.post("/", protect, createOrder);

// Verify a Razorpay payment signature and mark the order paid
router.post("/:id/verify-payment", protect, verifyRazorpayPayment);

// Customer order feed / tracking
router.get("/my-orders", protect, getUserOrders);

// Admin tracking summary (global overview)
router.get("/all", protect, adminCheck, getAllOrders);

// Admin-only status + Shiprocket tracking update
router.put("/:id/status", protect, adminCheck, updateDeliveryStatus);

module.exports = router;
