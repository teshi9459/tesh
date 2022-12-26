const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const db = require('../libs/db');
const { ActionRowBuilder, ChannelType, channelMention, ButtonStyle } = require('discord.js');
const dc = require('../libs/dc');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('manage Tickets')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('create Ticket module for guild')
                .addChannelOption(option => option.setName('channel').setDescription('Logchannel for tickets').setRequired(true).addChannelTypes(ChannelType.GuildText))
                .addRoleOption(option => option.setName('abnehmer').setDescription('Steckbrief Abnehmer Rolle').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('change logchannel')
                .addChannelOption(option => option.setName('channel').setDescription('Logchannel for tickets').setRequired(true).addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('pannel')
                .setDescription('create a Ticket-Pannel')
                .addStringOption(option => option.setName('type').setDescription('special pannel type').setRequired(true).addChoices(
                    { name: 'Steckbrief', value: 'char' },
                    { name: 'Bewerbung', value: 'team' },
                    { name: 'Support', value: 'supp' },
                ))
                .addStringOption(option => option.setName('info').setDescription('info on the pannel').setRequired(true))
                .addChannelOption(option => option.setName('category').setDescription('Categorie for new Tickets').setRequired(true).addChannelTypes(ChannelType.GuildCategory)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('delete pannel')
                .addStringOption(option => option.setName('id').setDescription('Pannel Id (unten am Pannel)').setRequired(true))),
    async execute(interaction) {
        let configs;
        if (!interaction.member.roles.cache.has(db.getGuildRole(interaction.guildId)))
            return interaction.reply({ embeds: [dc.sEmbed('Rolle fehlt', 'Du hast nicht die benötigten Berechtigungen', 'Tesh-Bot', '0xaaeeff')] });
        if (db.checkModule('ticket', interaction.guildId) && interaction.options.getSubcommand() == 'setup')
            return interaction.reply({ embeds: [dc.sEmbed('Tickets sind bereits aktiv', 'Um Pannel oder Tickets zu ändern schaue nach anderen Commands', interaction.guild.name, '0xaaeeff')] });
        if (!db.checkModule('words', interaction.guildId) && !interaction.options.getSubcommand() == 'setup')
            return interaction.reply({ embeds: [dc.sEmbed('Ticket muss erst erstellt werden', 'bitte benutze `/ticket setup` um zu starten', interaction.guild.name, '0xaaeeff')] });
        switch (interaction.options.getSubcommand()) {
            case 'setup':
                db.insertModule('ticket', true, interaction.guildId, {
                    channel: interaction.options.getChannel('channel').id,
                    role: interaction.options.getRole('abnehmer').id
                });
                await interaction.reply({ embeds: [dc.sEmbed('Tickets ist nun bereit', 'Erstelle ein Pannel mit `/ticket pannel `', interaction.guild.name, '0xaaeeff')] });
                break;
            case 'pannel':
                await interaction.reply('Ein Moment ...');
                await interaction.channel.send({
                    embeds: [dc.sEmbed('Ticket', 'Pannel wird generiert', 'Ticket System', '0xea5d5d')]
                }).then(msg => {
                    db.insertPannel(msg.id, interaction.channelId, interaction.options.getString('type'), interaction.options.getChannel('category').id);
                    const row = new ActionRowBuilder()
                        .addComponents(dc.createButton('ticket.create.' + msg.id, '📨 Ticket', ButtonStyle.Primary, null,));
                    msg.edit({
                        embeds: [dc.sEmbed('Ticket', interaction.options.getString('info') + '\n\n*öffne ein Ticket in dem du auf den Button klickst* ↓', 'Ticket Pannel ' + msg.id, '0xaaeeff')], components: [row]
                    });
                });
                await interaction.deleteReply();
                break;
            case 'delete':
                interaction.channel.messages.fetch(interaction.options.getString('id'))
                    .then(message => {
                        db.deletePannel(message.id, interaction.channel.id);
                        message.delete();
                        interaction.reply({ content: 'Pannel gelöscht!', ephemeral: true });
                    })
                    .catch(e => {
                        interaction.reply({ content: 'falsche Id', ephemeral: true });
                    });

                break;
            case 'channel':
                configs = db.getModuleConfig('ticket', interaction.guildId);
                configs.channel = interaction.options.getChannel('channel').id;
                db.updateModuleConfig('ticket', interaction.guildId, configs);
                await interaction.reply({ embeds: [dc.sEmbed('Tickets', `Der Channel wurde auf ${channelMention(configs.channel)} geändert`, interaction.guild.name, '0xaaeeff')] });
                break;
            default:
                break;
        }
    }
};