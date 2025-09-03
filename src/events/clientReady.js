module.exports = {
  name: "clientReady",
  once: true,
  execute(client) {
    const guildCount = client.guilds.cache.size;

    console.log(`[✓] Verbindung zu ${guildCount} Servern hergestellt`);
    console.log(`[?] starte Synchronisation der Guilds...`);

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
                console.error(
                  `[✗] API-Fehler beim Sync von Guild ${guild.id}:`,
                  err?.response?.data || err.message
                );
              })
          );
        });

        await Promise.all(tasks);
        console.log("[✓] Guild-Sync über Brain-API abgeschlossen");
      } catch (err) {
        console.error("[✗] Fehler beim Guild-Sync-Setup:", err.message);
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
