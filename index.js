const fs = require('node:fs').promises;
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const express = require('express');
const routes = require('./api/routes');
const cors = require('cors');

dotenv.config();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.plugins = new Collection();
async function loadPlugins() {
  if (client.plugins.size === 0) {
    const pluginsPath = path.join(__dirname, './plugins');
    const pluginFiles = await fs.readdir(pluginsPath);
    for (const file of pluginFiles) {
      if (file.endsWith('.js')) {
        const filePath = path.join(pluginsPath, file);
        const plugin = require(filePath);
        client.plugins.set(plugin.data.name, plugin);
      }
    }
  }
}



async function loadEvents() {
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = await fs.readdir(eventsPath);
  for (const file of eventFiles) {
    if (file.endsWith('.js')) {
      const filePath = path.join(eventsPath, file);
      const event = require(filePath);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
    }
  }
}

function clientMiddleware(req, res, next) {
  req.client = client;
  next();
}

async function login() {
  try {
    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error('Failed to login:', error);
  }
}
const app = express();
app.use(cors());
app.use('/api', clientMiddleware, routes);
app.listen(9459, () => {
  console.log('Server listening on port http://localhost:9459');
});
loadPlugins();
loadEvents().then(login);