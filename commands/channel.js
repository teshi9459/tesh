const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const db = require('../libs/db');
const { ChannelType, channelMention } = require('discord.js');
const dc = require('../libs/dc');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('change the Channel List')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('adds a RP Channel to the List')
                .addChannelOption(option => option.setName('channel').setDescription('Categorie which should be insert').setRequired(true)
                    .addChannelTypes(ChannelType.GuildCategory)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('del')
                .setDescription('deletes a channel from the list')
                .addChannelOption(option => option.setName('channel').setDescription('Categorie which should be delet').setRequired(true).addChannelTypes(ChannelType.GuildCategory)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('show list of channel')),
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