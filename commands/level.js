const { ChannelType, SlashCommandBuilder, channelMention } = require('discord.js');
const db = require('../libs/db');
const dc = require('../libs/dc');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('config the Level Module')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('create Module for Guild')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Logchannel for new Level')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('set Levels off or on')
                .addBooleanOption(option =>
                    option.setName('toggle')
                        .setDescription('true = on | false = off')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('trigger')
                .setDescription('set range for more leveling')
                .addIntegerOption(option =>
                    option
                        .setName('min')
                        .setDescription(
                            'all Messages under this get 1 xp'
                        )
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('max')
                        .setDescription(
                            'all messages from min to this get 5xp. All obove get the words count/2'
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
                        .setDescription('Channel to log level')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ping')
                .setDescription('toggle ping at card')
                .addBooleanOption(option =>
                    option
                        .setName('toggle')
                        .setDescription('true = on | false = off')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('card')
                .setDescription('get the levelcard')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('select an other user than you')
                )
        )

    ,
    async execute(interaction) {
        let configs;
        if (db.checkModule('level', interaction.guildId) && interaction.options.getSubcommand() == 'setup')
            return interaction.reply({ embeds: [dc.sEmbed('Level sind bereits aktiv', 'Um das Module zu ändern schaue nach anderen Commands', interaction.guild.name, '0xaaeeff')] });
        if (!db.checkModule('level', interaction.guildId) && !interaction.options.getSubcommand() == 'setup')
            return interaction.reply({ embeds: [dc.sEmbed('Level müssen erst erstellt werden', 'bitte benutze `/level setup` um zu starten', interaction.guild.name, '0xaaeeff')] });
        switch (interaction.options.getSubcommand()) {
            case 'setup':
                if (!interaction.member.roles.cache.has(db.getGuildRole(interaction.guildId)))
                    return interaction.reply({ embeds: [dc.sEmbed('Rolle fehlt', 'Du hast nicht die benötigten Berechtigungen', 'Tesh-Bot', '0xaaeeff')] });
                db.insertModule('level', false, interaction.guildId, { min: 2, max: 10, channel: interaction.options.getChannel('channel').id });
                await interaction.reply({ embeds: [dc.sEmbed('Level sind nun bereit', 'Aktiviere das Modul nun mit `/level toggle true `', interaction.guild.name, '0xaaeeff')] });
                break;
            case 'toggle':
                if (!interaction.member.roles.cache.has(db.getGuildRole(interaction.guildId)))
                    return interaction.reply({ embeds: [dc.sEmbed('Rolle fehlt', 'Du hast nicht die benötigten Berechtigungen', 'Tesh-Bot', '0xaaeeff')] });
                let stats = 'deaktiviert';
                if (interaction.options.getBoolean('toggle'))
                    stats = 'aktiviert'
                db.updateModuleStatus('level', interaction.guildId, interaction.options.getBoolean('toggle'));
                await interaction.reply({ embeds: [dc.sEmbed('Level', 'Das Modul wurde ' + stats, interaction.guild.name, '0xaaeeff')] });
                break;
            case 'trigger':
                if (!interaction.member.roles.cache.has(db.getGuildRole(interaction.guildId)))
                    return interaction.reply({ embeds: [dc.sEmbed('Rolle fehlt', 'Du hast nicht die benötigten Berechtigungen', 'Tesh-Bot', '0xaaeeff')] });
                configs = db.getModuleConfig('level', interaction.guildId);
                configs.min = interaction.options.getInteger('min');
                configs.max = interaction.options.getInteger('max');
                db.updateModuleConfig('level', interaction.guildId, configs);
                await interaction.reply({ embeds: [dc.sEmbed('Level', `Die Einstellungen wurden auf min: ${configs.min} max: ${configs.max} geändert`, interaction.guild.name, '0xaaeeff')] });
                break;
            case 'channel':
                if (!interaction.member.roles.cache.has(db.getGuildRole(interaction.guildId)))
                    return interaction.reply({ embeds: [dc.sEmbed('Rolle fehlt', 'Du hast nicht die benötigten Berechtigungen', 'Tesh-Bot', '0xaaeeff')] });
                configs = db.getModuleConfig('level', interaction.guildId);
                configs.channel = interaction.options.getChannel('channel').id;
                db.updateModuleConfig('level', interaction.guildId, configs);
                await interaction.reply({ embeds: [dc.sEmbed('Level', `Der Channel wurde auf ${channelMention(configs.channel)} geändert`, interaction.guild.name, '0xaaeeff')] });
                break;
            case 'ping':
                let stats2 = 'deaktiviert';
                if (interaction.options.getBoolean('toggle'))
                    stats2 = 'aktiviert'
                db.levelSetPing('level', interaction.guildId, interaction.options.getBoolean('toggle'));
                await interaction.reply({ embeds: [dc.sEmbed('Level', 'Der Ping ist nun ' + stats2, interaction.guild.name, '0xaaeeff')] });
                break;
            default:
                break;
        }
    },
};