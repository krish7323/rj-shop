// services/shiprocket.js
// Shiprocket integration helper.
//
// This is a stub/mock-ready module: when SHIPROCKET_EMAIL/PASSWORD are configured
// it is structured to authenticate and push a real shipment; without credentials
// (or when the network is unavailable) it logs and returns a simulated tracking id
// so the order flow never blocks. Swap the mock block for live axios calls when the
// Shiprocket account is ready.

const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

// Simple in-memory token cache (Shiprocket tokens last ~10 days).
let cachedToken = null;
let cachedAt = 0;
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000;

/**
 * Authenticate against Shiprocket and return a bearer token.
 * Returns null if credentials are missing (keeps the app running in stub mode).
 */
async function authenticate() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) return null;

  // Reuse a valid cached token.
  if (cachedToken && Date.now() - cachedAt < TOKEN_TTL_MS) return cachedToken;

  try {
    // Lazy require so the app doesn't hard-depend on axios being present.
    const axios = require("axios");
    const { data } = await axios.post(
      `${SHIPROCKET_BASE}/auth/login`,
      { email, password },
      { timeout: 12000 }
    );
    cachedToken = data.token;
    cachedAt = Date.now();
    return cachedToken;
  } catch (err) {
    console.warn(`⚠️  Shiprocket auth failed, falling back to stub: ${err.message}`);
    return null;
  }
}

/**
 * Create a Shiprocket shipment/order and return a tracking reference.
 *
 * @param {Object} order - a persisted Order document (or plain object).
 * @returns {Promise<{ trackingId: string, mode: 'live'|'stub', raw?: any }>}
 */
async function createShipment(order) {
  const token = await authenticate();

  // --- STUB / MOCK MODE ---------------------------------------------------
  // No credentials or auth failed → simulate a shipment so fulfilment can proceed.
  if (!token) {
    const trackingId = `SR-STUB-${String(order._id).slice(-6).toUpperCase()}-${
      String(Date.now()).slice(-5)
    }`;
    console.log(
      `📦 [Shiprocket STUB] Shipment logged for order ${order._id} → tracking ${trackingId}`
    );
    return { trackingId, mode: "stub" };
  }

  // --- LIVE MODE ----------------------------------------------------------
  try {
    const axios = require("axios");

    // Map our order into Shiprocket's ad-hoc order payload.
    const payload = {
      order_id: String(order._id),
      order_date: new Date().toISOString().slice(0, 10),
      pickup_location: process.env.SHIPROCKET_PICKUP || "Primary",
      billing_customer_name: order.shippingAddress.fullName,
      billing_last_name: "",
      billing_address: order.shippingAddress.street,
      billing_city: order.shippingAddress.city,
      billing_pincode: order.shippingAddress.postalCode,
      billing_state: order.shippingAddress.state,
      billing_country: order.shippingAddress.country || "India",
      billing_email: order.shippingEmail || "orders@rjshop.example",
      billing_phone: order.shippingAddress.phone,
      shipping_is_billing: true,
      order_items: order.items.map((i) => ({
        name: i.name,
        sku: i.sku,
        units: i.quantity,
        selling_price: i.price,
      })),
      payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
      sub_total: order.itemsPrice,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    const { data } = await axios.post(`${SHIPROCKET_BASE}/orders/create/adhoc`, payload, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    });

    // Shiprocket returns shipment_id / order_id; prefer shipment_id as tracking ref.
    const trackingId = String(data.shipment_id || data.order_id || `SR-${order._id}`);
    console.log(`📦 [Shiprocket LIVE] Shipment created for order ${order._id} → ${trackingId}`);
    return { trackingId, mode: "live", raw: data };
  } catch (err) {
    // Never let a shipping failure break payment/order flow — degrade to stub.
    const trackingId = `SR-STUB-${String(order._id).slice(-6).toUpperCase()}`;
    console.warn(
      `⚠️  Shiprocket live push failed for order ${order._id}, using stub: ${err.message}`
    );
    return { trackingId, mode: "stub" };
  }
}

module.exports = { authenticate, createShipment };
