const { SlashCommandBuilder, roleMention } = require('discord.js');
const { checkGuild, getGuildRole, insertGuild, logError } = require('../libs/db');
const { sEmbed } = require('../libs/dc');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Richte den Bot ein')
    .addRoleOption((option) =>
      option
        .setName('rolle')
        .setDescription(
          'Die Rolle die benötigt wird um den Bot zu verwalten (wenn nichts ausgewählt, wird Rolle erstellt)'
        )
        .setRequired(false)
    ),
  async execute(interaction) {
    try {
      const role = interaction.options.getRole('role');
      const guildId = interaction.guildId;
      const guildName = interaction.guild.name;
      const guildRegistered = await checkGuild(guildId);
      let replyEmbed = sEmbed(
        'Oops',
        `Es ist ein Fehler aufgetreten :/`,
        guildName,
        '0xff0000'
      );
      if (guildRegistered) {
        const guildRole = await getGuildRole(guildId);
        replyEmbed = sEmbed(
          'Server bereits registriert',
          `Du kannst Tesh bereits mit ${roleMention(guildRole)} verwenden. \nOder besuche https://teshbot.de/`,
          guildName,
          '0xaaeeff'
        );
      }
      if (role == undefined && !guildRegistered) {
        const newRole = await interaction.guild.roles.create({
          name: 'Tesh-Commander',
          color: '#aaeeff',
          reason: 'Teamrolle für Tesh',
        });
        await insertGuild(guildId, newRole.id);
        replyEmbed = sEmbed(
          'Server ist bereit!',
          `Der Server wurde mit der Rolle ${roleMention(newRole.id)} registriert.\nProbiere auch das Teshboard auf https://teshbot.de/ aus`,
          guildName,
          '0xaaeeff'
        );
      } else if (role != undefined && !guildRegistered) {
        await insertGuild(guildId, role.id);
        replyEmbed = sEmbed(
          'Server ist bereit!',
          `Der Server wurde mit der Rolle ${roleMention(role.id)} registriert.\nProbiere auch das Teshboard auf https://teshbot.de/ aus`,
          guildName,
          '0xaaeeff'
        );
      }

      return interaction.reply({ embeds: [replyEmbed] });
    } catch (error) {
      console.error(error);
      db.logError('bot', 'cmd setup', error);
      // Implementiere hier eine Fehlerbehandlungsroutine
    }
  },
};
