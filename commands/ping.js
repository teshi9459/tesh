const { SlashCommandBuilder } = require('discord.js');
const dc = require('../libs/dc');
const ms = require('ms');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    //maybe add db ping and webiste ping
    const text = "`" + interaction.client.ws.ping + "ms` ping\n\n`" + ms(interaction.client.uptime) + "` uptime\n";
    const embed = dc.sEmbed('PONG      🏓', text, 'Tesh\'s direkter Ping aus Teshi\'s Schlafzimmer!!', '0xaaeeff');
    await interaction.reply({
      embeds: [embed]
    });
  },
};
