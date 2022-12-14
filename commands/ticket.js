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
                .addChannelOption(option => option.setName('category').setDescription('Category for new Tickets').setRequired(true).addChannelTypes(ChannelType.GuildCategory)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('delete pannel')
                .addStringOption(option => option.setName('id').setDescription('Pannel Id (unten am Pannel)').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('change status for ticket')
                .addStringOption(option => option.setName('type').setDescription('type of working status').setRequired(true).addChoices(
                    { name: 'wird bearbeitet', value: 'work' },
                    { name: 'warten auf Antwort', value: 'wait' },
                    { name: 'Hilfe ben??tigt', value: 'help' },
                    { name: 'Sonderfall', value: 'spec' },
                    { name: 'Neu', value: 'newt' },
                ))),
    async execute(interaction) {
        let configs;
        if (!interaction.member.roles.cache.has(db.getGuildRole(interaction.guildId)))
            return interaction.reply({ embeds: [dc.sEmbed('Rolle fehlt', 'Du hast nicht die ben??tigten Berechtigungen', 'Tesh-Bot', '0xaaeeff')] });
        if (db.checkModule('ticket', interaction.guildId) && interaction.options.getSubcommand() == 'setup')
            return interaction.reply({ embeds: [dc.sEmbed('Tickets sind bereits aktiv', 'Um Pannel oder Tickets zu ??ndern schaue nach anderen Commands', interaction.guild.name, '0xaaeeff')] });
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
                        .addComponents(dc.createButton('ticket.create.' + msg.id, '???? Ticket', ButtonStyle.Primary, null,));
                    msg.edit({
                        embeds: [dc.sEmbed('Ticket', interaction.options.getString('info') + '\n\n*??ffne ein Ticket in dem du auf den Button klickst* ???', 'Ticket Pannel ' + msg.id, '0xaaeeff')], components: [row]
                    });
                });
                await interaction.deleteReply();
                break;
            case 'delete':
                interaction.channel.messages.fetch(interaction.options.getString('id'))
                    .then(message => {
                        db.deletePannel(message.id, interaction.channel.id);
                        message.delete();
                        interaction.reply({ content: 'Pannel gel??scht!', ephemeral: true });
                    })
                    .catch(e => {
                        interaction.reply({ content: 'falsche Id', ephemeral: true });
                    });

                break;
            case 'channel':
                configs = db.getModuleConfig('ticket', interaction.guildId);
                configs.channel = interaction.options.getChannel('channel').id;
                db.updateModuleConfig('ticket', interaction.guildId, configs);
                await interaction.reply({ embeds: [dc.sEmbed('Tickets', `Der Channel wurde auf ${channelMention(configs.channel)} ge??ndert`, interaction.guild.name, '0xaaeeff')] });
                break;
            case 'status':
                let statuslong;
                const name = interaction.channel.name.slice(1);
                switch (interaction.options.getString('type')) {
                    case 'work':
                        statuslong = 'wird bearbeitet';
                        interaction.channel.edit({ name: '????' + name });
                        break;
                    case 'wait':
                        statuslong = 'warten auf User';
                        interaction.channel.edit({ name: '????' + name });
                        break;
                    case 'help':
                        statuslong = 'Hilfe ben??tigt';
                        interaction.channel.edit({ name: '????' + name });
                        break;
                    case 'spec':
                        statuslong = 'Sonderfall';
                        interaction.channel.edit({ name: '???' + name });
                        break;
                    case 'newt':
                        statuslong = 'neues Ticket';
                        interaction.channel.edit({ name: '????' + name });
                        break;
                    default:
                        break;
                }
                await interaction.reply({ embeds: [dc.sEmbed('Ticket', `Der Channel wurde auf den Status **${statuslong}** ge??ndert.\n*Bitte die n??chste ??nderung erst in 10min ausf??hren!*`, 'Ticket System', '0xaaeeff')], ephemeral: true });
                break;
            default:
                break;
        }
    }
};