const fs = require("node:fs/promises");
const path = require("node:path");
const express = require("express");
const cors = require("cors");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const dotenv = require("dotenv");
const routes = require("./utils/routes.js");

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.plugins = new Collection();

// Plugin-Loader
async function loadPlugins() {
  const pluginsPath = path.join(__dirname, "./plugins");
  const pluginFiles = await fs.readdir(pluginsPath);

  for (const file of pluginFiles) {
    if (file.endsWith(".js")) {
      const filePath = path.join(pluginsPath, file);
      const plugin = require(filePath);
      client.plugins.set(plugin.name, plugin);
    }
  }
  console.log(`[+] ${pluginFiles.length} Plugins geladen`);
}

// Event-Loader
async function loadEvents() {
  const eventsPath = path.join(__dirname, "./events");
  const eventFiles = await fs.readdir(eventsPath);

  for (const file of eventFiles) {
    if (file.endsWith(".js")) {
      const filePath = path.join(eventsPath, file);
      const event = require(filePath);

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
    }
  }
  console.log(`[+] ${eventFiles.length} Events geladen`);
}

// Middleware: fügt Bot-Client in Request ein
function clientMiddleware(req, res, next) {
  req.client = client;
  next();
}

// Express-Server Setup
function startApiServer() {
  const app = express();
  app.use(cors());
  app.use("/api", clientMiddleware, routes);
  const port = process.env.API_PORT || 9459;
  app.listen(port, () => {
    console.log(`[✓] API hört auf http://localhost:${port}`);
  });
}

// Haupt-Init
async function main() {
  try {
    await loadPlugins();
    await loadEvents();
    await client.login(process.env.BOT_TOKEN);
    console.log(`[✓] Bot eingeloggt als ${client.user.tag}`);
    startApiServer();
  } catch (error) {
    console.error("[✗] Fehler beim Start:", error);
    process.exit(1);
  }
}

main();
