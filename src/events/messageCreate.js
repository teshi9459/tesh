const fs = require("fs");
module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message) {
    if (message.author.bot) return;
    message.client.plugins.forEach((plugin) => {
      if (plugin.enabled && plugin.messages) plugin.executeMessage(message);
    });
  },
};
