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
      console.log(`[✓] Guild-Sync (join): ${guild.id} (${guild.name})`);
    } catch (err) {
      console.error(
        `[✗] Guild-Sync (join) fehlgeschlagen: ${guild?.id}`,
        err?.response?.data || err.message
      );
    }
  },
};
