const https = require("https");

const sendWebhookNotification = (order) => {
  const webhookUrl = process.env.OWNER_NOTIFICATION_WEBHOOK;
  if (!webhookUrl) {
    console.log(`📢 [Local Log] New Order Created: #${order._id} (Total: ₹${order.totalPrice}). Configure OWNER_NOTIFICATION_WEBHOOK in .env to get instant phone alerts!`);
    return;
  }

  try {
    const orderItems = order.items
      .map((item) => `- ${item.quantity}x ${item.name} (₹${item.price})`)
      .join("\n");

    const payload = JSON.stringify({
      username: "RJ Mobile Store Alerts",
      content: `🔔 **New Order Placed on RJ Mobile Store!**\n\n` +
        `**Order ID:** \`#${String(order._id).slice(-8).toUpperCase()}\`\n` +
        `**Customer:** ${order.shippingAddress.fullName} (${order.shippingAddress.phone})\n` +
        `**Address:** ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}\n` +
        `**Payment Method:** ${order.paymentMethod}\n\n` +
        `**Items:**\n${orderItems}\n\n` +
        `**Total Price:** **₹${order.totalPrice}**`,
    });

    const parsedUrl = new URL(webhookUrl);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      console.log(`🚀 Owner notification webhook response status: ${res.statusCode}`);
    });

    req.on("error", (e) => {
      console.error(`⚠️ Webhook notification request failed: ${e.message}`);
    });

    req.write(payload);
    req.end();
  } catch (err) {
    console.error(`⚠️ Error triggering order notification: ${err.message}`);
  }
};

module.exports = { sendWebhookNotification };
