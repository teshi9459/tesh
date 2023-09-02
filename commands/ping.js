const { SlashCommandBuilder } = require('discord.js');
const dc = require('../libs/dc');
const ms = require('ms');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    //maybe add db ping and webiste ping
    const text = "`" + interaction.client.ws.ping + "ms` ping\n\n`" + ms(interaction.client.uptime) + "` uptime\n\n`" + ms(interaction.createdTimestamp - Date.now()) + "` response time \n\n`" + ms(interaction.client.ws.ping + interaction.createdTimestamp - Date.now()) + "` total time\n\n";
    const embed = dc.sEmbed('PONG      🏓', text, 'Tesh läuft auf deutschen Servern!', '0xaaeeff');
    await interaction.reply({
      embeds: [embed]
    });
  },
};
