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
        if (!interaction.member.roles.cache.has(await db.getGuildRole(interaction.guildId)))
            return interaction.reply({ embeds: [dc.sEmbed('Rolle fehlt', 'Du hast nicht die benötigten Berechtigungen', 'Tesh-Bot', '0xaaeeff')] });
        const check = await db.checkWordsSetup(interaction.guildId);
        if (check && interaction.options.getSubcommand() == 'setup')
            return interaction.reply({ embeds: [dc.sEmbed('Words ist bereits aktiv', 'Um das Module zu ändern schaue nach anderen Commands', interaction.guild.name, '0xaaeeff')] });
        if (!check && !interaction.options.getSubcommand() == 'setup')
            return interaction.reply({ embeds: [dc.sEmbed('Words muss erst erstellt werden', 'bitte benutze `/words setup` um zu starten', interaction.guild.name, '0xaaeeff')] });
        switch (interaction.options.getSubcommand()) {
            case 'setup':
                await db.insertWordsConfig(interaction.guildId, interaction.options.getChannel('channel').id);
                await interaction.reply({ embeds: [dc.sEmbed('Words ist nun bereit', 'Aktiviere das Modul nun mit `/words toggle true `', interaction.guild.name, '0xaaeeff')] });
                break;
            case 'toggle':
                let stats = 'deaktiviert';
                if (interaction.options.getBoolean('toggle'))
                    stats = 'aktiviert'
                await db.updateWordsToggle(interaction.guildId, interaction.options.getBoolean('toggle'));
                await interaction.reply({ embeds: [dc.sEmbed('Words', 'Das Modul wurde ' + stats, interaction.guild.name, '0xaaeeff')] });
                break;
            case 'trigger':
                await db.updateWordsTrigger(interaction.guildId, interaction.options.getInteger('min'), interaction.options.getInteger('max'));
                await interaction.reply({ embeds: [dc.sEmbed('Words', `Die Einstellungen wurden auf min: ${interaction.options.getInteger('min')} max: ${interaction.options.getInteger('max')} geändert`, interaction.guild.name, '0xaaeeff')] });
                break;
            case 'channel':
                await db.updateWordsChannel(interaction.guildId, interaction.options.getChannel('channel').id);
                await interaction.reply({ embeds: [dc.sEmbed('Words', `Der Channel wurde auf ${interaction.options.getChannel('channel')} geändert`, interaction.guild.name, '0xaaeeff')] });
                break;
            case 'warning':
                let stats2 = 'deaktiviert';
                if (interaction.options.getBoolean('toggle'))
                    stats2 = 'aktiviert';
                await db.updateWordsWarning(interaction.guildId, interaction.options.getBoolean('toggle'));
                await interaction.reply({ embeds: [dc.sEmbed('Words', 'Warnungen sind nun ' + stats2, interaction.guild.name, '0xaaeeff')] });
                break;
            default:
                break;
        }
    },
};