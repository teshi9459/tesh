const fs = require("node:fs/promises");
const path = require("node:path");
const express = require("express");
const cors = require("cors");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const dotenv = require("dotenv");
const routes = require("./utils/routes.js");
const { api, metricsRegister } = require("./utils/api.js");
const logger = require("./utils/logger.js");

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
  logger.info({ count: pluginFiles.length }, "Plugins geladen");
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
  logger.info({ count: eventFiles.length }, "Events geladen");
}

// Middleware: fÃ¼gt Bot-Client in Request ein
function clientMiddleware(req, res, next) {
  req.client = client;
  next();
}

// Express-Server Setup
function startBotApiServer() {
  const app = express();
  app.use(cors());
  app.use("/api", clientMiddleware, routes);
  app.get("/metrics", async (_req, res) => {
    try {
      res.set("Content-Type", metricsRegister.contentType);
      res.send(await metricsRegister.metrics());
    } catch (err) {
      logger.error({ err }, "Fehler beim Ausliefern der Metrics");
      res.status(500).send("metrics unavailable");
    }
  });
  const port = process.env.PORT || 9459;
  app.listen(port, () => {
    logger.info({ port }, "Bot API gestartet");
  });
}

//Test-backend-API
function checkApiServer() {
  api
    .get("/")
    .then(() => {
      logger.info("Brain-API erreichbar");
    })
    .catch((error) => {
      logger.error({ err: error }, "Fehler beim Abrufen des API-Status");
    });
}

// Haupt-Init
async function main() {
  try {
    await loadPlugins();
    await loadEvents();
    await client.login(process.env.BOT_TOKEN);
    logger.info({ tag: client.user.tag }, "Bot eingeloggt");
    startBotApiServer();
    checkApiServer();
  } catch (error) {
    logger.error({ err: error }, "Fehler beim Bot-Start");
    process.exit(1);
  }
}

main();
