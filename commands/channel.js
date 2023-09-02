const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const db = require('../libs/db');
const { ChannelType, channelMention } = require('discord.js');
const dc = require('../libs/dc');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kanal')
        .setDescription('Ändert die Kanalliste')
        .addSubcommand(subcommand =>
            subcommand
                .setName('hinzufügen')
                .setDescription('Fügt einen RP-Kanal zur Liste hinzu')
                .addChannelOption(option => option.setName('kanal').setDescription('Kategorie, die hinzugefügt werden soll').setRequired(true)
                    .addChannelTypes(ChannelType.GuildCategory)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('entfernen')
                .setDescription('Entfernt einen Kanal aus der Liste')
                .addChannelOption(option => option.setName('kanal').setDescription('Kategorie, die entfernt werden soll').setRequired(true).addChannelTypes(ChannelType.GuildCategory)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('liste')
                .setDescription('Zeigt die Liste der Kanäle an')),
    async execute(interaction) {
        if (!interaction.member.roles.cache.has(await db.getGuildRole(interaction.guildId)))
            return interaction.reply({ embeds: [dc.sEmbed('Rolle fehlt', 'Du hast nicht die benötigten Berechtigungen', 'Tesh-Bot', '0xaaeeff')] });
        switch (interaction.options.getSubcommand()) {
            case 'hinzufügen':
                if (await db.checkChannel(interaction.options.getChannel('kanal').id, interaction.guildId))
                    return interaction.reply({ embeds: [dc.sEmbed('RP-Kanal', channelMention(interaction.options.getChannel('kanal').id) + ' wurde bereits hinzugefügt', 'Tesh-Bot', '0xdd0303')] });
                await db.insertChannel(interaction.options.getChannel('kanal').id, 'rpC', interaction.guildId);
                await interaction.reply({ embeds: [dc.sEmbed('RP-Kanal', channelMention(interaction.options.getChannel('kanal').id) + ' wurde hinzugefügt', 'Tesh-Bot', '0xaaeeff')] });
                break;
            case 'entfernen':
                if (!await db.checkChannel(interaction.options.getChannel('kanal').id, interaction.guildId))
                    return interaction.reply({ embeds: [dc.sEmbed('RP-Kanal', channelMention(interaction.options.getChannel('kanal').id) + ' wurde nicht gefunden', 'Tesh-Bot', '0xdd0303')] });
                await db.deleteChannel(interaction.options.getChannel('kanal').id, interaction.guildId);
                await interaction.reply({ embeds: [dc.sEmbed('RP-Kanal', channelMention(interaction.options.getChannel('kanal').id) + ' wurde entfernt.', 'Tesh-Bot', '0xaaeeff')] });
                break;
            case 'liste':
                const kanäle = await db.getChannel(interaction.guildId);
                let liste = '\n';
                for (const element of kanäle) {
                    liste += channelMention(element.id) + '\n'
                }
                await interaction.reply({ embeds: [dc.sEmbed('__RP-Känale__', liste, kanäle.length + ' RP-Kanäle sind registriert', '0xaaeeff')] });
                break;
        }
    }
};