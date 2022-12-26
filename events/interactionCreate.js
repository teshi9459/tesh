const fs = require('node:fs');
const path = require('node:path');
const ticketManager = require('../exports/message/ticket');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isCommand()) {
      console.log(
        `${interaction.user.tag} triggered in #${interaction.channel.name} -> /${interaction.commandName} ${interaction.options.getSubcommand(false)}`
      );

      //commandhandling checken
      const client = new Client({ intents: [GatewayIntentBits.Guilds] });

      client.commands = new Collection();
      const commandsPath = path.join(__dirname, '../commands');
      const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith('.js'));

      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        client.commands.set(command.data.name, command);
      }

      const command = client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
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
