const { createHandler } = require("@vercel/slack-bolt");
const { app, receiver } = require("../../bolt-app");

const slackHandler = createHandler(app, receiver);

module.exports = {
  async fetch(request) {
    return slackHandler(request);
  },
};
