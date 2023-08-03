const fs = require('node:fs').promises;
const path = require('node:path');
const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const express = require('express');
const routes = require('./api/routes');

dotenv.config();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});
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
app.use('/api', clientMiddleware, routes);
app.listen(9459, () => {
  console.log('Server listening on port http://localhost:9459');
});
loadEvents().then(login);