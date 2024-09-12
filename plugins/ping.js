const { SlashCommandBuilder } = require('discord.js');
const dc = require('../libs/dc');
const ms = require('ms');
module.exports = {
    //info
    name: 'ping',
    enabled: true,
    //interctions
    slashCommands: true,
    contectMenues: false,
    buttons: false,
    selectMenues: false,
    modal: false,
    messages: false,
    //categorys
    database: false,
    logging: false,
    moderation: false,
    ephemeralresponse: true,
    setup: false,
    //SlashCommands Builder
    data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('spiel Tischtennis mit mir C:'),

  async executeSlashCommand(interaction) {
    //maybe add db ping and webiste ping
    const text = "`" + interaction.client.ws.ping + "ms` ping\n\n`" + ms(interaction.client.uptime) + "` uptime\n";
    const embed = dc.sEmbed('PONG      🏓', text, 'Tesh\'s direkter Ping aus Teshi\'s Schlafzimmer!!', '0xaaeeff');
    await interaction.reply({
      embeds: [embed]
    });
  },
};