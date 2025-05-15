const axios = require("axios");

const API_URL = process.env.API_URL || "http://localhost:3001/api";
const BOT_SECRET = process.env.BOT_SECRET;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bot ${BOT_SECRET}`,
    "Content-Type": "application/json",
  },
});

module.exports = { api };
