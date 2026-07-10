// services/razorpay.js
// Razorpay gateway helper: lazily constructs a Razorpay instance from env keys,
// creates gateway orders, and verifies payment/webhook signatures with HMAC-SHA256.

const crypto = require("crypto");

let instance = null;

/**
 * Returns a configured Razorpay client, or null if keys are not set
 * (lets the order flow continue in COD/stub mode without crashing).
 */
function getClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;

  if (!instance) {
    const Razorpay = require("razorpay");
    instance = new Razorpay({ key_id, key_secret });
  }
  return instance;
}

/**
 * Create a Razorpay order for the given rupee amount.
 * @param {number} amountInRupees
 * @param {string} receipt - our internal reference (e.g. Mongo order id)
 * @returns {Promise<object|null>} the Razorpay order, or null if not configured
 */
async function createGatewayOrder(amountInRupees, receipt) {
  const client = getClient();
  if (!client) return null;

  return client.orders.create({
    amount: Math.round(Number(amountInRupees) * 100), // paise
    currency: "INR",
    receipt: String(receipt),
    payment_capture: 1,
  });
}

/**
 * Verify the signature returned by Razorpay checkout after a payment.
 * signature === HMAC_SHA256(order_id + "|" + payment_id, key_secret)
 */
function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !razorpayOrderId || !razorpayPaymentId || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  // Constant-time comparison to avoid timing attacks.
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Verify a Razorpay *webhook* payload signature.
 * signature === HMAC_SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET)
 */
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody))
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = {
  getClient,
  createGatewayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
