const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const db = require('../libs/db');
const { ChannelType, channelMention } = require('discord.js');
const dc = require('../libs/dc');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('insta')
        .setDescription('Instagramm for Roleplay')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('intitial insta')
                .addChannelOption(option => option.setName('channel').setDescription('Feed Channel for Posts').setRequired(true)
                    .addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('create a new Profile for a Char')
                .addStringOption(option => option.setName('username').setDescription('Name of profile').setRequired(true))
                .addAttachmentOption(option => option.setName('profilepicture').setDescription('Picture for the Profile').setRequired(true))
                .addStringOption(option => option.setName('charname').setDescription('Name of char').setRequired(true))),
    async execute(interaction) {
        if (!interaction.member.roles.cache.has(db.getGuildRole(interaction.guildId)))
            return interaction.reply({ embeds: [dc.sEmbed('Rolle fehlt', 'Du hast nicht die benötigten Berechtigungen', 'Tesh-Bot', '0xaaeeff')] });
        switch (interaction.options.getSubcommand()) {
            case 'add':
                if (db.checkChannel(interaction.options.getChannel('channel').id, interaction.guildId))
                    return interaction.reply({ embeds: [dc.sEmbed('RP-Channel', channelMention(interaction.options.getChannel('channel').id) + ' wurde schon hinzugefügt', 'Tesh-Bot', '0xdd0303')] });
                db.insertChannel(interaction.options.getChannel('channel').id, interaction.guildId);
                await interaction.reply({ embeds: [dc.sEmbed('RP-Channel', channelMention(interaction.options.getChannel('channel').id) + ' wurde hinzugefügt', 'Tesh-Bot', '0xaaeeff')] });
                break;
            case 'del':
                if (!db.checkChannel(interaction.options.getChannel('channel').id, interaction.guildId))
                    return interaction.reply({ embeds: [dc.sEmbed('RP-Channel', channelMention(interaction.options.getChannel('channel').id) + ' wurde nicht gefunden', 'Tesh-Bot', '0xdd0303')] });
                db.deleteChannel(interaction.options.getChannel('channel').id, interaction.guildId);
                await interaction.reply({ embeds: [dc.sEmbed('RP-Channel', channelMention(interaction.options.getChannel('channel').id) + ' wurde entfernt.', 'Tesh-Bot', '0xaaeeff')] });
                break;
            case 'list':
                const channels = db.getChannel(interaction.guildId);
                let list = '\n';
                for (const element of channels) {
                    list += channelMention(element.id) + '\n'
                }
                await interaction.reply({ embeds: [dc.sEmbed('__RP-Channel__', list, channels.length + ' RP-Channel sind registriert', '0xaaeeff')] });
                break;
        }
    }
};