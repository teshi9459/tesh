const db = require('../libs/db');
module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    const guildCount = client.guilds.cache.size;
    console.log(`online as ${client.user.tag} auf ${guildCount} Servern`);
    client.user.setPresence({
      activities: [
        {
          name: `auf ${guildCount} Servern`,
        },
      ],
      status: 'online',
    });
    db.setupCheck();
  },
};