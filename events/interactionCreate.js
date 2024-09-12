const fs = require('node:fs/promises');
const path = require('node:path');
const ticketManager = require('../exports/message/ticket');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const db = require('../libs/db');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {
    
    switch (interaction.commandType) {
      case 1: //slash commands
        const plugin = interaction.client.plugins.get(interaction.commandName);
        if (!plugin) return;
        try {
          await plugin.executeSlashCommand(interaction);
        } catch (error) {
          console.error(error);
          db.logError('bot', 'itc create', error);
        }
        break;

      case 2://UI-based command User
        
      console.log(interaction.type);
        break;    

      case 3:   //message

      console.log(interaction.type);
        break;

      case 4: //UI-based command PrimaryEntryPoint

      console.log(interaction.type);
        break;
    
      default:
        break;
    }


  },
};