const { App } = require("@slack/bolt");
const { VercelReceiver } = require("@vercel/slack-bolt");
const { registerMessageEvent } = require("./handlers");

const receiver = new VercelReceiver();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  receiver,
  processBeforeResponse: true,
  deferInitialization: true,
});

registerMessageEvent(app);

module.exports = { app, receiver };
