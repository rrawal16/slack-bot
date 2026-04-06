const SOURCE_CHANNEL_ID = process.env.SOURCE_CHANNEL_ID;
const DEST_CHANNEL_ID = process.env.DEST_CHANNEL_ID;

const KEYWORDS = [
  "app",
  "manager app",
  "business manager app",
  "manager",
  "App",
  "Mobile App",
  "Business Manager App",
  "bma",
];

function registerMessageEvent(slackApp) {
  slackApp.event("message", async ({ event, client, logger }) => {
    try {
      if (event.bot_id || event.subtype) return;
      if (event.channel !== SOURCE_CHANNEL_ID) return;

      const text = (event.text || "").toLowerCase();
      const seen = new Set();
      const matched = [];
      for (const k of KEYWORDS) {
        const keyLower = k.toLowerCase();
        if (text.includes(keyLower) && !seen.has(keyLower)) {
          seen.add(keyLower);
          matched.push(k);
        }
      }

      if (matched.length === 0) return;

      await client.chat.postMessage({
        channel: DEST_CHANNEL_ID,
        text:
          `New merchant feedback from <@${event.user}> in <#${SOURCE_CHANNEL_ID}>.\n` +
          `Matched keywords: ${matched.join(", ")}\n\n` +
          `${event.text}`,
      });
    } catch (err) {
      logger.error(err);
    }
  });
}

module.exports = { registerMessageEvent };
