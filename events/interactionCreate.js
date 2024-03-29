const fs = require('node:fs/promises');
const path = require('node:path');
const ticketManager = require('../exports/message/ticket');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const db = require('../libs/db');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isCommand()) {
      console.log(
        `${interaction.user.tag} triggered in #${interaction.channel.name} -> /${interaction.commandName} ${interaction.options.getSubcommand(false)}`
      );
      db.logUse('bot', `${interaction.guild.id}-${interaction.user.tag} #${interaction.channel.name} -> /${interaction.commandName} ${interaction.options.getSubcommand(false)}`);
      if (!await db.checkUser(interaction.user.id) && await db.checkGuild(interaction.guildId)) db.insertUser(interaction.user.id);
      if (client.commands.size === 0) {
        const commandsPath = path.join(__dirname, '../commands');
        const commandFiles = await fs.readdir(commandsPath);
        for (const file of commandFiles) {
          if (file.endsWith('.js')) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            client.commands.set(command.data.name, command);
          }
        }
      }
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        db.logError('bot', 'itc create', error);
        // Handle the error appropriately (e.g., display a user-friendly error message)
      }
    } else if (interaction.isButton()) {
      const id = interaction.customId.split('.');
      switch (id[0]) {
        case 'ticket':
          ticketManager.gotButton(interaction, id[1], id[2]);
          break;
        default:
          interaction.deleteReply();
          break;
      }
    }
  },
};