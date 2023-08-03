const { SlashCommandBuilder } = require('discord.js');
const dc = require('../libs/dc');
const ms = require('ms');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    const text = "`" + interaction.client.ws.ping + "ms` ping\n\n`" + ms(interaction.client.uptime) + "` uptime"
    const embed = dc.sEmbed('PONG      🏓', text, 'Tesh läuft auf deutschen Servern!', '0xaaeeff');
    await interaction.reply({
      embeds: [embed]
    });
  },
};
