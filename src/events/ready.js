module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    const guildCount = client.guilds.cache.size;

    console.log(`[✓] Verbindung zu ${guildCount} Servern hergestellt`);

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
