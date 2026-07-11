const https = require("https");

const postRequest = (url, payload) => {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
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
        resolve(res.statusCode);
      });
      req.on("error", (e) => reject(e));
      req.write(payload);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

const getRequest = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      resolve(res.statusCode);
    }).on("error", (e) => reject(e));
  });
};

const sendWebhookNotification = async (order) => {
  const orderIdShort = String(order._id).slice(-8).toUpperCase();
  const orderItemsText = order.items
    .map((item) => `• ${item.quantity}x ${item.name} (₹${item.price})`)
    .join("\n");
  
  const customerName = order.shippingAddress.fullName;
  const customerPhone = order.shippingAddress.phone;
  const addressText = `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`;
  const paymentMethod = order.paymentMethod;
  const totalPrice = order.totalPrice;

  // 1. DISCORD WEBHOOK ALERT
  const discordWebhookUrl = process.env.OWNER_NOTIFICATION_WEBHOOK;
  if (discordWebhookUrl) {
    try {
      const payload = JSON.stringify({
        username: "RJ Mobile Store Alerts",
        content: `🔔 **New Order Placed on RJ Mobile Store!**\n\n` +
          `**Order ID:** \`#${orderIdShort}\`\n` +
          `**Customer:** ${customerName} (${customerPhone})\n` +
          `**Address:** ${addressText}\n` +
          `**Payment Method:** ${paymentMethod}\n\n` +
          `**Items:**\n${orderItemsText}\n\n` +
          `**Total Price:** **₹${totalPrice}**`,
      });
      await postRequest(discordWebhookUrl, payload);
      console.log(`🚀 Discord webhook alert triggered for order #${orderIdShort}`);
    } catch (err) {
      console.error(`⚠️ Discord notification failed: ${err.message}`);
    }
  }

  // 2. TELEGRAM BOT ALERT
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChatId) {
    try {
      const text = `🔔 *New Order on RJ Mobile Store!*\n\n` +
        `*Order ID:* #${orderIdShort}\n` +
        `*Customer:* ${customerName} (${customerPhone})\n` +
        `*Address:* ${addressText}\n` +
        `*Payment:* ${paymentMethod}\n\n` +
        `*Items:* \n${orderItemsText}\n\n` +
        `*Total Price:* *₹${totalPrice}*`;
      const encodedText = encodeURIComponent(text);
      const url = `https://api.telegram.org/bot${tgToken}/sendMessage?chat_id=${tgChatId}&text=${encodedText}&parse_mode=Markdown`;
      await getRequest(url);
      console.log(`🚀 Telegram bot alert sent for order #${orderIdShort}`);
    } catch (err) {
      console.error(`⚠️ Telegram notification failed: ${err.message}`);
    }
  }

  // 3. WHATSAPP ALERT (via CallMeBot API)
  const callmebotPhone = process.env.CALLMEBOT_PHONE;
  const callmebotApiKey = process.env.CALLMEBOT_API_KEY;
  if (callmebotPhone && callmebotApiKey) {
    try {
      const text = `🔔 *New Order on RJ Mobile Store!*\n\n` +
        `*Order ID:* #${orderIdShort}\n` +
        `*Customer:* ${customerName} (${customerPhone})\n` +
        `*Address:* ${addressText}\n` +
        `*Payment:* ${paymentMethod}\n\n` +
        `*Items:* \n${orderItemsText}\n\n` +
        `*Total Price:* *₹${totalPrice}*`;
      const encodedText = encodeURIComponent(text);
      const url = `https://api.callmebot.com/whatsapp.php?phone=${callmebotPhone}&text=${encodedText}&apikey=${callmebotApiKey}`;
      await getRequest(url);
      console.log(`🚀 WhatsApp CallMeBot alert sent for order #${orderIdShort}`);
    } catch (err) {
      console.error(`⚠️ WhatsApp notification failed: ${err.message}`);
    }
  }

  // Local log fallback if nothing is configured
  if (!discordWebhookUrl && !(tgToken && tgChatId) && !(callmebotPhone && callmebotApiKey)) {
    console.log(`📢 [Local Log] New Order Created: #${orderIdShort} (Total: ₹${totalPrice}). Setup Discord Webhook, Telegram Bot, or WhatsApp API in .env to get instant phone alerts!`);
  }
};

module.exports = { sendWebhookNotification };
