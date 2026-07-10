// controllers/adminController.js
// Advanced business analytics for the shop owner, built on MongoDB aggregation.
// Only "Paid" orders (or delivered COD) count toward revenue/spend metrics.

const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// A reusable match stage: an order counts as "real revenue" if it was paid,
// OR it is a COD order that has been delivered (cash collected on delivery).
const REVENUE_MATCH = {
  $or: [{ paymentStatus: "Paid" }, { paymentMethod: "COD", status: "Delivered" }],
};

/**
 * GET /api/admin/metrics/total-spending
 * Total active-user spending: sum of all realized order revenue,
 * plus counts of paying customers and orders.
 */
const totalActiveUserSpending = async (req, res) => {
  try {
    const result = await Order.aggregate([
      { $match: REVENUE_MATCH },
      {
        $group: {
          _id: null,
          totalSpending: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
          payingCustomers: { $addToSet: "$user" },
          avgOrderValue: { $avg: "$totalPrice" },
        },
      },
      {
        $project: {
          _id: 0,
          totalSpending: 1,
          totalOrders: 1,
          activePayingCustomers: { $size: "$payingCustomers" },
          avgOrderValue: { $round: ["$avgOrderValue", 2] },
        },
      },
    ]);

    const data = result[0] || {
      totalSpending: 0,
      totalOrders: 0,
      activePayingCustomers: 0,
      avgOrderValue: 0,
    };

    return res.status(200).json({ success: true, metrics: data });
  } catch (error) {
    console.error(`totalActiveUserSpending error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to compute spending" });
  }
};

/**
 * GET /api/admin/metrics/top-customers?limit=10
 * Top customer directory ranked by realized lifetime spend.
 */
const topCustomers = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const customers = await Order.aggregate([
      { $match: REVENUE_MATCH },
      {
        $group: {
          _id: "$user",
          totalSpent: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
          lastOrderAt: { $max: "$createdAt" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: "$user.name",
          email: "$user.email",
          totalSpent: { $round: ["$totalSpent", 2] },
          orderCount: 1,
          lastOrderAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: customers.length,
      topCustomers: customers,
    });
  } catch (error) {
    console.error(`topCustomers error: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Failed to compute top customers" });
  }
};

/**
 * GET /api/admin/metrics/low-stock?threshold=5
 * Low-stock alerts for active products at or below a threshold.
 */
const lowStockAlerts = async (req, res) => {
  try {
    const threshold = Math.max(0, parseInt(req.query.threshold, 10) || 5);

    const products = await Product.find({
      isActive: true,
      stock: { $lte: threshold },
    })
      .select("name sku category price stock")
      .sort({ stock: 1 });

    return res.status(200).json({
      success: true,
      threshold,
      count: products.length,
      lowStock: products.map((p) => ({
        _id: p._id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        price: p.price,
        stock: p.stock,
        status: p.stock === 0 ? "OUT_OF_STOCK" : "LOW",
      })),
    });
  } catch (error) {
    console.error(`lowStockAlerts error: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Failed to compute low-stock alerts" });
  }
};

/**
 * GET /api/admin/metrics/revenue-breakdown
 * Total custom revenue breakdown: overall realized revenue plus splits by
 * payment method and by order status, and pending (not-yet-collected) revenue.
 */
const revenueBreakdown = async (req, res) => {
  try {
    const [realized, byMethod, byStatus, pending] = await Promise.all([
      // Overall realized revenue.
      Order.aggregate([
        { $match: REVENUE_MATCH },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalPrice" },
            tax: { $sum: "$taxPrice" },
            shipping: { $sum: "$shippingPrice" },
            orders: { $sum: 1 },
          },
        },
        { $project: { _id: 0, revenue: 1, tax: 1, shipping: 1, orders: 1 } },
      ]),

      // Split by payment method (COD vs Razorpay).
      Order.aggregate([
        { $match: REVENUE_MATCH },
        {
          $group: {
            _id: "$paymentMethod",
            revenue: { $sum: "$totalPrice" },
            orders: { $sum: 1 },
          },
        },
        { $project: { _id: 0, method: "$_id", revenue: 1, orders: 1 } },
      ]),

      // Split across all order statuses (full lifecycle visibility).
      Order.aggregate([
        {
          $group: {
            _id: "$status",
            revenue: { $sum: "$totalPrice" },
            orders: { $sum: 1 },
          },
        },
        { $project: { _id: 0, status: "$_id", revenue: 1, orders: 1 } },
        { $sort: { revenue: -1 } },
      ]),

      // Revenue still pending collection.
      Order.aggregate([
        {
          $match: {
            paymentStatus: "Pending",
            status: { $nin: ["Cancelled", "Returned"] },
          },
        },
        {
          $group: {
            _id: null,
            pendingRevenue: { $sum: "$totalPrice" },
            pendingOrders: { $sum: 1 },
          },
        },
        { $project: { _id: 0, pendingRevenue: 1, pendingOrders: 1 } },
      ]),
    ]);

    const totals = realized[0] || { revenue: 0, tax: 0, shipping: 0, orders: 0 };
    const pendingTotals = pending[0] || { pendingRevenue: 0, pendingOrders: 0 };

    return res.status(200).json({
      success: true,
      breakdown: {
        realized: {
          totalRevenue: Math.round(totals.revenue * 100) / 100,
          totalTax: Math.round(totals.tax * 100) / 100,
          totalShipping: Math.round(totals.shipping * 100) / 100,
          netProductRevenue:
            Math.round((totals.revenue - totals.tax - totals.shipping) * 100) / 100,
          paidOrders: totals.orders,
        },
        byPaymentMethod: byMethod,
        byOrderStatus: byStatus,
        pending: pendingTotals,
      },
    });
  } catch (error) {
    console.error(`revenueBreakdown error: ${error.message}`);
    return res
      .status(500)
      .json({ success: false, message: "Failed to compute revenue breakdown" });
  }
};

/**
 * GET /api/admin/metrics/overview
 * Convenience dashboard: headline counts across the shop.
 */
const dashboardOverview = async (req, res) => {
  try {
    const [totalUsers, totalProducts, activeProducts, totalOrders] = await Promise.all([
      User.countDocuments({}),
      Product.countDocuments({}),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      overview: { totalUsers, totalProducts, activeProducts, totalOrders },
    });
  } catch (error) {
    console.error(`dashboardOverview error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to load overview" });
  }
};

module.exports = {
  totalActiveUserSpending,
  topCustomers,
  lowStockAlerts,
  revenueBreakdown,
  dashboardOverview,
};
