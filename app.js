const express = require("express");
const { App, ExpressReceiver } = require("@slack/bolt");
const { registerMessageEvent } = require("./handlers");

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true,
});

const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

registerMessageEvent(slackApp);

const expressApp = express();
expressApp.use(receiver.router);

expressApp.get("/", (_req, res) => {
  res.status(200).type("text/plain").send("Slack bot OK — use POST /slack/events for Slack.");
});

module.exports = expressApp;
