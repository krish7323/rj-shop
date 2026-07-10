// routes/adminRoutes.js
// Admin analytics. Every route is guarded by protect + adminCheck.

const express = require("express");
const router = express.Router();

const {
  totalActiveUserSpending,
  topCustomers,
  lowStockAlerts,
  revenueBreakdown,
  dashboardOverview,
} = require("../controllers/adminController");
const { protect, adminCheck } = require("../middleware/auth");

// Apply auth + admin guard to all routes in this router.
router.use(protect, adminCheck);

router.get("/metrics/overview", dashboardOverview);
router.get("/metrics/total-spending", totalActiveUserSpending);
router.get("/metrics/top-customers", topCustomers);
router.get("/metrics/low-stock", lowStockAlerts);
router.get("/metrics/revenue-breakdown", revenueBreakdown);

module.exports = router;
