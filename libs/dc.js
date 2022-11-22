const fs = require('fs');
const tools = require('./tools');
const { EmbedBuilder } = require('discord.js');
module.exports = {
  /**
   * erstellt ein sehr einfaches Embed
   * @param {String} title Titel
   * @param {String} descript Description
   * @param {String} footer Footer
   * @param {String} color Farbe in Hex code (0xaaeeff)
   * @return {EmbedBuilder} Embed
   */
  sEmbed: function (title, descript, footer, color) {
    return new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(descript)
      .setFooter({
        text: footer,
      });
  },
  getChannel: function (message, id) {
    const obj = message.guild.channels.cache.find(c => c.id == id);
    return obj;
  },
  getUser: function (message, id) {
    const obj = message.guild.members.cache.find(c => c.id == id);
    return obj.user;
  },
  getMember: function (message, id) {
    const obj = message.guild.members.cache.find(c => c.id == id);
    return obj;
  },
  getRole: function (message, id) {
    const obj = message.guild.roles.cache.find(c => c.id == id);
    return obj;
  },
};
