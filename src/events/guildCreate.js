const logger = require("../utils/logger.js");
module.exports = {
  name: "guildCreate",
  once: false,
  async execute(guild, client) {
    try {
      const { api } = require("../utils/api.js");
      await api.post("/guilds", {
        discord_id: guild.id,
        last_known_name: guild.name,
      });
      logger.info({ guildId: guild.id, guildName: guild.name }, "Guild-Sync (join)");
    } catch (err) {
      logger.error(
        `[×] Guild-Sync (join) fehlgeschlagen: ${guild?.id}`,
        err?.response?.data || err.message
      );
    }
  },
};
