// utils/sendNotification.js
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const sendNotification = async ({ title, message, external_id }) => {
  try {
    const payload = {
      app_id: process.env.ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      included_segments: external_id ? undefined : ["All"],
      include_external_user_ids: external_id ? [external_id] : undefined,
    };

    const response = await axios.post("https://onesignal.com/api/v1/notifications", payload, {
      headers: {
        Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log("🔔 Notificação enviada:", response.data);
  } catch (err) {
    console.error("❌ Erro ao enviar notificação:", err.response?.data || err.message);
  }
};

module.exports = sendNotification;
