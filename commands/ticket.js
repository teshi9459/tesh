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
                .setName('pannel')
                .setDescription('create a Ticket-Pannel')
                .addStringOption(option => option.setName('name').setDescription('What kind of ticket should be created (Support, Abgabe, etc)').setRequired(true))
                .addStringOption(option => option.setName('text').setDescription('Text that is showen in a new Ticket').setRequired(true))
                .addStringOption(option => option.setName('info').setDescription('info on the pannel').setRequired(true))
                .addChannelOption(option => option.setName('category').setDescription('Category for new Tickets').setRequired(true).addChannelTypes(ChannelType.GuildCategory))
                .addChannelOption(option => option.setName('log').setDescription('Channel for logging').setRequired(true)))
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
                    { name: 'Hilfe benötigt', value: 'help' },
                    { name: 'Sonderfall', value: 'spec' },
                    { name: 'Neu', value: 'newt' },
                ))),
    async execute(interaction) {
        if (!interaction.member.roles.cache.has(await db.getGuildRole(interaction.guildId)))
            return interaction.reply({ embeds: [dc.sEmbed('Rolle fehlt', 'Du hast nicht die benötigten Berechtigungen', 'Tesh-Bot', '0xaaeeff')] });
        switch (interaction.options.getSubcommand()) {
            case 'pannel':
                await interaction.reply('Ein Moment ...');
                await interaction.channel.send({
                    embeds: [dc.sEmbed('Ticket', 'Pannel wird generiert', 'Ticket System', '0xea5d5d')]
                }).then(msg => {
                    db.insertTicketPanel(msg.id, interaction.channelId, msg.guildId, interaction.options.getString('text'), interaction.options.getChannel('category').id, interaction.options.getChannel('log').id);
                    const row = new ActionRowBuilder()
                        .addComponents(dc.createButton('ticket.create.' + msg.id, '📨 Ticket', ButtonStyle.Primary, null,));
                    msg.edit({
                        embeds: [dc.sEmbed(interaction.options.getString('name') + ' Ticket', interaction.options.getString('info') + '\n\n*öffne ein Ticket in dem du auf den Button klickst* ↓', 'Ticket Pannel ' + msg.id, '0xaaeeff')], components: [row]
                    });
                });
                await interaction.deleteReply();
                break;
            case 'delete':
                interaction.channel.messages.fetch(interaction.options.getString('id'))
                    .then(message => {
                        db.deleteTicketPanel(message.id, interaction.guildId);
                        message.delete();
                        interaction.reply({ content: 'Pannel gelöscht!', ephemeral: true });
                    })
                    .catch(e => {
                        interaction.reply({ content: 'falsche Id', ephemeral: true });
                    });

                break;

            case 'status':
                let statuslong;
                const name = interaction.channel.name.slice(1);
                switch (interaction.options.getString('type')) {
                    case 'work':
                        statuslong = 'wird bearbeitet';
                        interaction.channel.edit({ name: '🔧' + name });
                        break;
                    case 'wait':
                        statuslong = 'warten auf User';
                        interaction.channel.edit({ name: '🕒' + name });
                        break;
                    case 'help':
                        statuslong = 'Hilfe benötigt';
                        interaction.channel.edit({ name: '🚸' + name });
                        break;
                    case 'spec':
                        statuslong = 'Sonderfall';
                        interaction.channel.edit({ name: '⭕' + name });
                        break;
                    case 'newt':
                        statuslong = 'neues Ticket';
                        interaction.channel.edit({ name: '🆕' + name });
                        break;
                    default:
                        break;
                }
                await interaction.reply({ embeds: [dc.sEmbed('Ticket', `Der Channel wurde auf den Status **${statuslong}** geändert.\n*Bitte die nächste änderung erst in 10min ausführen!*`, 'Ticket System', '0xaaeeff')], ephemeral: true });
                break;
            default:
                break;
        }
    }
};