const { SlashCommandBuilder } = require('discord.js');
const db = require('../libs/db');
const dc = require('../libs/dc');
const { roleMention } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('setup the Bot')
    .addRoleOption((option) =>
      option
        .setName('role')
        .setDescription(
          'Role whitch is requied for using administrativ bot commands (if not selected will create a role)'
        )
        .setRequired(false)
    ),
  async execute(interaction) {
    let role = interaction.options.getRole('role');
    if (db.checkGuild(interaction.guildId)) {
      return interaction.reply({
        embeds: [
          dc.sEmbed(
            'Server bereits registriert',
            `Du kannst Tesh schon mit ${roleMention(
              db.getGuildRole(interaction.guildId)
            )} benutzen`,
            interaction.guild.name,
            '0xaaeeff'
          ),
        ],
      });
    }
    if (role == undefined) {
      interaction.guild.roles
        .create({
          name: 'Tesh-Commander',
          color: '#aaeeff',
          reason: 'Teamrolle für Tesh',
        })
        .then((newRole) => {
          db.insertGuild(interaction.guildId, newRole.id);
          return interaction.reply({
            embeds: [
              dc.sEmbed(
                'Server bereit!',
                `Der Server wurde mit der Rolle ${roleMention(
                  newRole.id
                )} registriert.`,
                interaction.guild.name,
                '0xaaeeff'
              ),
            ],
          });
        })
        .catch(console.error);
    } else {
      db.insertGuild(interaction.guildId, role.id);
      return interaction.reply({
        embeds: [
          dc.sEmbed(
            'Server bereit!',
            `Der Server wurde mit der Rolle ${roleMention(
              role.id
            )} registriert.`,
            interaction.guild.name,
            '0xaaeeff'
          ),
        ],
      });
    }
  },
};
