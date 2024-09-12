const fs = require("node:fs/promises");
const path = require("node:path");
const ticketManager = require("../exports/message/ticket");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const db = require("../libs/db");
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(interaction) {
    console.log(interaction.toJSON());
    console.log(interaction.type);
    let plugin = null;
    switch (interaction.type) {
      case 1: //slash commands ??
        break;

      case 2: //UI-based command User (slashs)
         plugin = interaction.client.plugins.get(interaction.commandName);
        if (!plugin) return;
        if (!plugin.enabled) return;
        if (!plugin.slashCommands) return;
        try {
          await plugin.executeSlashCommand(interaction);
        } catch (error) {
          console.error(error);
          //db.logError('bot', 'itc create', error);
        }
        break;

      case 3: //message (buttons)
       plugin = interaction.client.plugins.get(interaction.customId.split('.')[0]);
        if (!plugin) return;
        if (!plugin.enabled) return;
        if (!plugin.buttons) return;
        try {
          await plugin.executeButton(interaction);
        } catch (error) {
          console.error(error);
          //db.logError('bot', 'itc create', error);
        }
        break;

      case 4: //UI-based command PrimaryEntryPoint
        break;

      default:
        break;
    }
  },
};
