// models/Order.js
// Order schema: items array, order status tracker, payment method (COD/Razorpay),
// payment status, and a placeholder field for the Shiprocket tracking ID.

const mongoose = require("mongoose");

// A single line item captured at purchase time (price is snapshotted).
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Order item must reference a product"],
    },
    name: {
      type: String,
      required: [true, "Order item name is required"],
    },
    sku: {
      type: String,
      required: [true, "Order item SKU is required"],
    },
    image: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Order item price is required"],
      validate: {
        validator: (value) => value > 0,
        message: "Item price must be positive",
      },
    },
    quantity: {
      type: Number,
      required: [true, "Order item quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },
  },
  { _id: false }
);

// Shipping address snapshot taken at checkout.
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order must belong to a user"],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "An order must contain at least one item",
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, "Shipping address is required"],
    },

    // Money — computed/validated at checkout, stored non-negative.
    itemsPrice: { type: Number, required: true, min: 0 },
    shippingPrice: { type: Number, required: true, min: 0, default: 0 },
    taxPrice: { type: Number, required: true, min: 0, default: 0 },
    totalPrice: { type: Number, required: true, min: 0 },

    // Order lifecycle status tracker.
    status: {
      type: String,
      enum: {
        values: [
          "Pending",
          "Confirmed",
          "Processing",
          "Shipped",
          "Delivered",
          "Cancelled",
          "Returned",
        ],
        message: "Invalid order status",
      },
      default: "Pending",
      index: true,
    },

    // Payment method: COD, Razorpay, or UPI.
    paymentMethod: {
      type: String,
      enum: {
        values: ["COD", "Razorpay", "UPI"],
        message: "Payment method must be COD, Razorpay, or UPI",
      },
      required: [true, "Payment method is required"],
    },

    // Payment state independent of order lifecycle.
    paymentStatus: {
      type: String,
      enum: {
        values: ["Pending", "Paid", "Failed", "Refunded"],
        message: "Invalid payment status",
      },
      default: "Pending",
    },

    // UPI Transaction Ref / UTR
    upiTransactionId: { type: String, default: "" },

    // Razorpay gateway references (populated after a successful transaction).
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },

    paidAt: { type: Date },
    deliveredAt: { type: Date },

    // Placeholder for the Shiprocket shipment tracking ID (filled by shipping hooks).
    shiprocketTrackingId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
