const logger = require("../utils/logger.js");
module.exports = {
  name: "clientReady",
  once: true,
  execute(client) {
    const guildCount = client.guilds.cache.size;

    logger.info({ guildCount }, "Verbindung zu Guilds hergestellt");
    logger.info("Starte Synchronisation der Guilds");

    // überprüfe via Brain-API; wenn nicht vorhanden, füge sie hinzu (upsert auf discord_id)
    (async () => {
      try {
        const { api } = require("../utils/api.js");
        const tasks = [];

        client.guilds.cache.forEach((guild) => {
          tasks.push(
            api
              .post("/guilds", {
                discord_id: guild.id,
                last_known_name: guild.name,
              })
              .catch((err) => {
                logger.error(
                  `[✗] API-Fehler beim Sync von Guild ${guild.id}:`,
                  err?.response?.data || err.message
                );
              })
          );
        });

        await Promise.all(tasks);
        logger.info("[✓] Guild-Sync über Brain-API abgeschlossen");
      } catch (err) {
        logger.error("[✗] Fehler beim Guild-Sync-Setup:", err.message);
      }
    })();

    client.user.setPresence({
      activities: [
        {
          name: `auf ${guildCount} Servern`,
        },
      ],
      status: "online",
    });
  },
};
