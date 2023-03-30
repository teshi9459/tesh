const fs = require('fs');
const tools = require('./tools');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events } = require('discord.js');
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
      .setTitle(title)
      .setDescription(descript)
      .setFooter({
        text: footer,
      });
  },
  /**
  * erstellt ein button
  * @param {Number} id Button Id
  * @param {String} label Text auf Button
  * @param {String} url Link for Button
  * @param {String} emoji emoji for Button
  * @param {ButtonStyle} style Buttontyp
  * @param {Boolean} status true for disabled
  * @return {ButtonBuilder} Button
  */
  createButton: function (id, label, style, url, emoji, status) {
    const obj = new ButtonBuilder()
      .setCustomId(id)
      .setLabel(label)
      .setStyle(style)
    if (style == ButtonStyle.Link)
      obj.setURL(url);
    if (emoji != undefined)
      obj.setEmoji(emoji);
    if (status != undefined)
      obj.setDisabled(status)
    return obj;
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
