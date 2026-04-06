require("dotenv").config();
const { App } = require("@slack/bolt");

const SOURCE_CHANNEL_ID = process.env.SOURCE_CHANNEL_ID;   // #merchant-nps channel ID
const DEST_CHANNEL_ID = process.env.DEST_CHANNEL_ID;       // tracking channel ID

const KEYWORDS = [
  "app",
  "manager app",
  "business manager app",
  "manager"
];

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,   // xoxb-...
  appToken: process.env.SLACK_APP_TOKEN, // xapp-...
  socketMode: true,
});

app.event("message", async ({ event, client, logger }) => {
  try {
    // Ignore bot messages, message edits, and anything not from #merchant-nps
    if (event.bot_id || event.subtype) return;
    if (event.channel !== SOURCE_CHANNEL_ID) return;

    const text = (event.text || "").toLowerCase();
    const matched = KEYWORDS.filter((k) => text.includes(k));

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

(async () => {
  await app.start();
  console.log("Slack bot is running in Socket Mode");
})();