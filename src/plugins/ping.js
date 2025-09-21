const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const dc = require("../utils/dc");
const ms = require("ms");
const axios = require("axios");
const { api } = require("../utils/api");

module.exports = {
  // Info
  name: "ping",
  enabled: true,

  // Interaktionstypen
  slashCommands: true,
  contectMenues: false,
  buttons: false,
  selectMenues: false,
  modal: false,
  messages: false,

  // Kategorien
  database: false,
  logging: false,
  moderation: false,
  ephemeralresponse: true,
  setup: false,

  // SlashCommands Builder
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("spiel Tischtennis mit mir C:"),

  async executeSlashCommand(interaction) {
    const discordPing = interaction.client.ws.ping;
    const uptime = ms(interaction.client.uptime);
    let apiPing = null;
    let dbPing = null;

    try {
      const start = Date.now();
      const res = await api.get("/ping");
      const apiReseve = res.data.arrivalTime;
      apiPing = apiReseve - start;
      dbPing = typeof res.data.dbPing === "number" ? res.data.dbPing : null;
    } catch (err) {
      logger.error({ err }, "Fehler beim Abrufen von /api/ping");
    }

    const lines = [
      `------------------------------------`,
      `⏱️ **Bot Uptime:** \`${uptime}\``,
      `📡 **Discord-Ping:** \`${discordPing}ms\``,
      apiPing !== null
        ? `🧠 **API-Ping:** \`${apiPing}ms\``
        : `🧠 **API-Ping:** \´ ~ \´`,
      dbPing !== null
        ? `🗃️ **DB-Ping:** \`${dbPing}ms\``
        : `🗃️ **DB-Ping:** \´ ~ \´`,
    ];

    const embed = dc.sEmbed(
      "🏓 Pong!",
      lines.join("\n"),
      "Tesh Ping Tool",
      "#aaeeff"
    );

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};
