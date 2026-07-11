// controllers/orderController.js
// Order lifecycle: secure checkout with server-side price verification and atomic
// stock decrement, admin status/tracking updates, and order retrieval feeds.
//
// Payment methods: 'COD' | 'Razorpay'.
// - COD: order is Confirmed immediately and a Shiprocket shipment is logged.
// - Razorpay: a live gateway order is created; paymentStatus flips to 'Paid' only
//   after HMAC signature verification (checkout callback or webhook), which then
//   triggers the Shiprocket shipment push.

const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const razorpay = require("../services/razorpay");
const shiprocket = require("../services/shiprocket");
const { sendWebhookNotification } = require("../services/notification");

// Map the requested public status labels onto the model's status enum.
// The task specifies Ordered/Shipped/Delivered; we accept those plus the full enum.
const STATUS_ALIASES = {
  Ordered: "Confirmed",
  Confirmed: "Confirmed",
  Processing: "Processing",
  Shipped: "Shipped",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
  Returned: "Returned",
  Pending: "Pending",
};

// Small currency-safe rounding helper (avoid float drift on money).
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Fulfilment hook: push the order to Shiprocket and persist the tracking id.
 * Called as soon as an order becomes fulfilable (COD confirmed, or Razorpay paid).
 * Idempotent — skips if a tracking id already exists. Never throws to callers.
 */
async function triggerShiprocket(order) {
  try {
    if (!order) return;
    if (order.shiprocketTrackingId) return; // already shipped/logged
    if (["Cancelled", "Returned"].includes(order.status)) return;

    const { trackingId, mode } = await shiprocket.createShipment(order);
    order.shiprocketTrackingId = trackingId;
    // Advance early-stage orders to Processing once a shipment is logged.
    if (["Pending", "Confirmed"].includes(order.status)) order.status = "Processing";
    await order.save();
    console.log(`✅ Shiprocket (${mode}) tracking ${trackingId} saved on order ${order._id}`);
  } catch (err) {
    console.error(`triggerShiprocket error for order ${order?._id}: ${err.message}`);
  }
}

/**
 * POST /api/orders  (protected)
 * Body: {
 *   items: [{ product: <id>, quantity: <int> }],
 *   shippingAddress: { fullName, phone, street, city, state, postalCode, country? },
 *   paymentMethod: 'COD' | 'Razorpay',
 *   shippingPrice?: number, taxPrice?: number,
 *   clientTotal?: number   // optional; validated against server total if sent
 * }
 *
 * Prices are ALWAYS taken from the live product documents (snapshot), never from
 * the client. Stock is decremented atomically and rolled back on any failure.
 */
const createOrder = async (req, res) => {
  // Track successful stock decrements so we can roll them back on error.
  const decremented = [];

  try {
    // --- Verify that the requester user is verified ---
    if (req.user && req.user.role === "Customer" && !req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Your account is not verified. Please verify your account first to place orders.",
      });
    }

    const {
      items,
      shippingAddress,
      paymentMethod,
      shippingPrice = 0,
      taxPrice = 0,
      clientTotal,
      upiTransactionId,
    } = req.body;

    // --- Validate payload shape ---
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Order must contain at least one item" });
    }
    if (!paymentMethod || !["COD", "Razorpay", "UPI"].includes(paymentMethod)) {
      return res
        .status(400)
        .json({ success: false, message: "paymentMethod must be 'COD', 'Razorpay', or 'UPI'" });
    }
    if (paymentMethod === "UPI" && (!upiTransactionId || !upiTransactionId.trim())) {
      return res
        .status(400)
        .json({ success: false, message: "UPI Transaction UTR/Ref ID is required for online UPI payments." });
    }
    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "shippingAddress is required" });
    }
    const requiredAddr = ["fullName", "phone", "street", "city", "state", "postalCode"];
    for (const field of requiredAddr) {
      if (!shippingAddress[field]) {
        return res
          .status(400)
          .json({ success: false, message: `shippingAddress.${field} is required` });
      }
    }

    // --- Normalize + validate line items, collapse duplicates ---
    const qtyByProduct = new Map();
    for (const line of items) {
      const id = line.product;
      const qty = Number(line.quantity);
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Each item needs a valid product id" });
      }
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({
          success: false,
          message: "Each item quantity must be a positive integer",
        });
      }
      qtyByProduct.set(id, (qtyByProduct.get(id) || 0) + qty);
    }

    const productIds = [...qtyByProduct.keys()];

    // --- Load live products for pricing snapshot ---
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      return res
        .status(404)
        .json({ success: false, message: "One or more products no longer exist" });
    }

    // --- Build order items from server-side prices; verify stock availability ---
    const orderItems = [];
    let itemsPrice = 0;

    for (const product of products) {
      const qty = qtyByProduct.get(String(product._id));

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is not available`,
        });
      }
      if (product.stock < qty) {
        return res.status(409).json({
          success: false,
          message: `Insufficient stock for "${product.name}" (have ${product.stock}, need ${qty})`,
        });
      }

      itemsPrice += product.price * qty;

      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        image: product.images && product.images.length ? product.images[0] : "",
        price: product.price, // snapshot of current price
        quantity: qty,
      });
    }

    itemsPrice = round2(itemsPrice);
    const ship = round2(Math.max(0, Number(shippingPrice) || 0));
    const tax = round2(Math.max(0, Number(taxPrice) || 0));
    const totalPrice = round2(itemsPrice + ship + tax);

    // --- If the client sent a total, it MUST match the server computation ---
    if (clientTotal !== undefined && round2(clientTotal) !== totalPrice) {
      return res.status(400).json({
        success: false,
        message: `Total mismatch: client ${round2(clientTotal)} vs server ${totalPrice}. Refresh cart.`,
      });
    }

    // --- Atomically decrement stock (guarded so we never oversell) ---
    for (const item of orderItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity }, isActive: true },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updated) {
        // Someone else bought the stock between our read and write — roll back.
        throw Object.assign(new Error(`Stock changed for "${item.name}", please retry`), {
          statusCode: 409,
        });
      }
      decremented.push({ product: item.product, quantity: item.quantity });
    }

    // --- Persist the order ---
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country || "India",
      },
      itemsPrice,
      shippingPrice: ship,
      taxPrice: tax,
      totalPrice,
      paymentMethod,
      upiTransactionId: paymentMethod === "UPI" ? upiTransactionId.trim() : "",
      // COD is confirmed immediately; Razorpay & UPI stay Pending until payment verified.
      status: paymentMethod === "COD" ? "Confirmed" : "Pending",
      paymentStatus: "Pending",
    });

    // --- Payment-method-specific handling ---
    if (paymentMethod === "Razorpay") {
      // Create a live Razorpay gateway order so the client can open checkout.
      let gatewayOrder = null;
      try {
        gatewayOrder = await razorpay.createGatewayOrder(totalPrice, order._id);
      } catch (rzpErr) {
        console.error(`Razorpay order creation failed: ${rzpErr.message}`);
      }

      if (gatewayOrder) {
        order.razorpayOrderId = gatewayOrder.id;
        await order.save();
      }

      return res.status(201).json({
        success: true,
        message: gatewayOrder
          ? "Order created. Complete payment via Razorpay."
          : "Order created. Razorpay is not configured — set keys to enable live payments.",
        order,
        razorpay: gatewayOrder
          ? {
              orderId: gatewayOrder.id,
              amount: gatewayOrder.amount, // paise
              currency: gatewayOrder.currency,
              keyId: process.env.RAZORPAY_KEY_ID || null,
            }
          : null,
      });
    }

    if (paymentMethod === "UPI") {
      sendWebhookNotification(order);
      return res.status(201).json({
        success: true,
        message: "Order placed successfully. Waiting for admin UPI verification.",
        order,
      });
    }

    // --- COD: fulfilable immediately → push Shiprocket shipment now ---
    await triggerShiprocket(order);
    sendWebhookNotification(order);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully (Cash on Delivery)",
      order,
    });
  } catch (error) {
    // Roll back any stock we decremented before the failure.
    if (decremented.length) {
      await Promise.all(
        decremented.map((d) =>
          Product.updateOne({ _id: d.product }, { $inc: { stock: d.quantity } })
        )
      ).catch((rbErr) => console.error(`stock rollback failed: ${rbErr.message}`));
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    const code = error.statusCode || 500;
    console.error(`createOrder error: ${error.message}`);
    return res
      .status(code)
      .json({ success: false, message: error.message || "Failed to create order" });
  }
};

/**
 * POST /api/orders/:id/verify-payment  (protected)
 * Body: { razorpayPaymentId, razorpaySignature }  (order id from the route param)
 * Verifies the Razorpay checkout signature with HMAC-SHA256. On success, flips
 * paymentStatus → 'Paid', confirms the order, and triggers the Shiprocket push.
 */
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpayPaymentId, razorpaySignature } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.paymentMethod !== "Razorpay") {
      return res
        .status(400)
        .json({ success: false, message: "This order is not a Razorpay order" });
    }
    if (!order.razorpayOrderId) {
      return res
        .status(400)
        .json({ success: false, message: "No Razorpay order attached to this order" });
    }
    // Already paid — idempotent success.
    if (order.paymentStatus === "Paid") {
      return res.status(200).json({ success: true, message: "Payment already verified", order });
    }

    const valid = razorpay.verifyPaymentSignature({
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!valid) {
      order.paymentStatus = "Failed";
      await order.save();
      return res
        .status(400)
        .json({ success: false, message: "Payment signature verification failed" });
    }

    // Mark paid instantly and record gateway references.
    order.paymentStatus = "Paid";
    order.paidAt = new Date();
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    if (order.status === "Pending") order.status = "Confirmed";
    await order.save();

    // Payment succeeded → push the shipment to Shiprocket.
    await triggerShiprocket(order);
    sendWebhookNotification(order);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }
    console.error(`verifyRazorpayPayment error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

/**
 * POST /api/orders/webhook/razorpay  (public — Razorpay calls this)
 * Verifies the webhook signature against the raw body, then marks the matching
 * order Paid and triggers Shiprocket. Must be mounted with a raw body parser.
 */
const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    // server.js mounts this route with express.raw, so req.body is a Buffer.
    const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body);

    if (!razorpay.verifyWebhookSignature(raw, signature)) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const event = JSON.parse(raw);
    const entity =
      event?.payload?.payment?.entity || event?.payload?.order?.entity || {};
    const rzpOrderId = entity.order_id || entity.id;
    const rzpPaymentId = entity.id;

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const order = await Order.findOne({ razorpayOrderId: rzpOrderId });
      if (order && order.paymentStatus !== "Paid") {
        order.paymentStatus = "Paid";
        order.paidAt = new Date();
        if (rzpPaymentId) order.razorpayPaymentId = rzpPaymentId;
        if (order.status === "Pending") order.status = "Confirmed";
        await order.save();
        await triggerShiprocket(order);
        sendWebhookNotification(order);
      }
    }

    // Always 200 so Razorpay doesn't keep retrying a handled event.
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(`razorpayWebhook error: ${error.message}`);
    // Still 200 to avoid infinite retries on unparseable payloads.
    return res.status(200).json({ received: true });
  }
};

/**
 * PUT /api/orders/:id/status  (admin)
 * Body: { status?: 'Ordered'|'Shipped'|'Delivered'|..., shiprocketTrackingId?: string }
 * Updates the order lifecycle status and/or the Shiprocket tracking id.
 */
const updateDeliveryStatus = async (req, res) => {
  try {
    const { status, shiprocketTrackingId } = req.body;

    if (status === undefined && shiprocketTrackingId === undefined) {
      return res.status(400).json({
        success: false,
        message: "Provide a status and/or shiprocketTrackingId to update",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // --- Status update (mapped through aliases) ---
    if (status !== undefined) {
      const mapped = STATUS_ALIASES[status];
      if (!mapped) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${Object.keys(STATUS_ALIASES).join(", ")}`,
        });
      }

      order.status = mapped;

      // Delivered COD means the cash has been collected.
      if (mapped === "Delivered") {
        order.deliveredAt = new Date();
        if (order.paymentMethod === "COD" && order.paymentStatus !== "Paid") {
          order.paymentStatus = "Paid";
          order.paidAt = new Date();
        }
      }
    }

    // --- Shiprocket tracking id (shipping hook) ---
    if (shiprocketTrackingId !== undefined) {
      order.shiprocketTrackingId = String(shiprocketTrackingId).trim();
      // If a tracking id is assigned and the order isn't further along, mark Shipped.
      if (order.shiprocketTrackingId && ["Pending", "Confirmed", "Processing"].includes(order.status)) {
        order.status = "Shipped";
      }
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order updated",
      order,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    console.error(`updateDeliveryStatus error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to update order" });
  }
};

/**
 * GET /api/orders/my-orders  (protected)
 * Returns the authenticated customer's orders, newest first.
 */
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error(`getUserOrders error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to fetch your orders" });
  }
};

/**
 * GET /api/orders/all  (admin)
 * Global order overview with optional filters, pagination, and headline metrics.
 * Query: status?, paymentMethod?, paymentStatus?, page?, limit?
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, paymentMethod, paymentStatus, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = STATUS_ALIASES[status] || status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total, summaryAgg] = await Promise.all([
      Order.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query),
      Order.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalValue: { $sum: "$totalPrice" },
            avgValue: { $avg: "$totalPrice" },
          },
        },
        { $project: { _id: 0, totalValue: 1, avgValue: { $round: ["$avgValue", 2] } } },
      ]),
    ]);

    const summary = summaryAgg[0] || { totalValue: 0, avgValue: 0 };

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      summary: {
        totalValue: round2(summary.totalValue),
        avgOrderValue: round2(summary.avgValue),
      },
      orders,
    });
  } catch (error) {
    console.error(`getAllOrders error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

module.exports = {
  createOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  updateDeliveryStatus,
  getUserOrders,
  getAllOrders,
};
