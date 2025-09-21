const express = require("express");
const { performance } = require("node:perf_hooks");
const mysql = require("mysql2/promise");
const logger = require("./logger.js");
require("dotenv").config();
const router = express.Router();

router.get("/", async (req, res) => {
  const apiStart = performance.now();

  // Vorbereitung der Antwortwerte
  let dbPing = null;

  try {
    // Datenbankverbindung herstellen (du kannst ggf. deinen Pool auslagern)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const dbStart = performance.now();
    await connection.query("SELECT 1"); // einfache Abfrage zum Testen
    dbPing = Math.round(performance.now() - dbStart);

    await connection.end();
  } catch (err) {
    logger.error("[✗] Fehler beim DB-Ping:", err.message);
  }

  const apiUptime = Math.round(performance.now() - apiStart);

  return res.json({
    apiUptime,
    dbPing,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
