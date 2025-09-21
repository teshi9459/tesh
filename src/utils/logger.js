const pino = require("pino");

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

let transport;
if (process.env.NODE_ENV !== "production") {
  try {
    transport = pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        singleLine: false,
      },
    });
  } catch (err) {
    // Fällt zurück auf Standard-Transport, falls pino-pretty nicht verfügbar ist
    transport = undefined;
  }
}

const logger = pino(
  {
    level,
    base: {
      app: "discord-bot",
      env: process.env.NODE_ENV || "development",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport
);

module.exports = logger;
