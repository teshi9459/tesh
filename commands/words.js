const { ChannelType, SlashCommandBuilder, channelMention } = require('discord.js');
const db = require('../libs/db');
const dc = require('../libs/dc');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('words')
        .setDescription('config the Words Module')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('create Module for Guild')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Logchannel for reports')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('set Words off or on')
                .addBooleanOption(option =>
                    option.setName('toggle')
                        .setDescription('true = on | false = off')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('trigger')
                .setDescription('set range witch triggers an report')
                .addIntegerOption(option =>
                    option
                        .setName('min')
                        .setDescription(
                            'all Messages with wordscount under this will be ignored (recommended is 2)'
                        )
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('max')
                        .setDescription(
                            'all messages from min to this will be reported (wordscount)'
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('set logchannel')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Channel to log reports')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('warning')
                .setDescription('toggle warning user in channel')
                .addBooleanOption(option =>
                    option
                        .setName('toggle')
                        .setDescription('true = on | false = off')
                        .setRequired(true)
                )
        )

    ,
    async execute(interaction) {
        let configs;
        if (!interaction.member.roles.cache.has(db.getGuildRole(interaction.guildId)))
            return interaction.reply({ embeds: [dc.sEmbed('Rolle fehlt', 'Du hast nicht die benötigten Berechtigungen', 'Tesh-Bot', '0xaaeeff')] });
        if (db.checkModule('words', interaction.guildId) && interaction.options.getSubcommand() == 'setup')
            return interaction.reply({ embeds: [dc.sEmbed('Words ist bereits aktiv', 'Um das Module zu ändern schaue nach anderen Commands', interaction.guild.name, '0xaaeeff')] });
        switch (interaction.options.getSubcommand()) {
            case 'setup':
                db.insertModule('words', false, interaction.guildId, { min: 2, max: 10, channel: interaction.options.getChannel('channel').id, warning: false });
                await interaction.reply({ embeds: [dc.sEmbed('Words ist nun bereit', 'Aktiviere das Modul nun mit `/words toggle true `', interaction.guild.name, '0xaaeeff')] });
                break;
            case 'toggle':
                let stats = 'deaktiviert';
                if (interaction.options.getBoolean('toggle'))
                    stats = 'aktiviert'
                db.updateModuleStatus('words', interaction.guildId, interaction.options.getBoolean('toggle'));
                await interaction.reply({ embeds: [dc.sEmbed('Words', 'Das Modul wurde ' + stats, interaction.guild.name, '0xaaeeff')] });
                break;
            case 'trigger':
                configs = db.getModuleConfig('words', interaction.guildId);
                configs.min = interaction.options.getInteger('min');
                configs.max = interaction.options.getInteger('max');
                db.updateModuleConfig('words', interaction.guildId, configs);
                await interaction.reply({ embeds: [dc.sEmbed('Words', `Die Einstellungen wurden auf min: ${configs.min} max: ${configs.max} geändert`, interaction.guild.name, '0xaaeeff')] });
                break;
            case 'channel':
                configs = db.getModuleConfig('words', interaction.guildId);
                configs.channel = interaction.options.getChannel('channel').id;
                db.updateModuleConfig('words', interaction.guildId, configs);
                await interaction.reply({ embeds: [dc.sEmbed('Words', `Der Channel wurde auf ${channelMention(configs.channel)} geändert`, interaction.guild.name, '0xaaeeff')] });
                break;
            case 'warning':
                let stats2 = 'deaktiviert';
                if (interaction.options.getBoolean('toggle'))
                    stats2 = 'aktiviert'
                configs = db.getModuleConfig('words', interaction.guildId);
                configs.warning = interaction.options.getBoolean('toggle');
                db.updateModuleConfig('words', interaction.guildId, configs);
                await interaction.reply({ embeds: [dc.sEmbed('Words', 'Warnungen sind nun ' + stats2, interaction.guild.name, '0xaaeeff')] });
                break;
            default:
                break;
        }
    },
};