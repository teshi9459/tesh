const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const db = require('../libs/db');
const { ChannelType, channelMention } = require('discord.js');
const dc = require('../libs/dc');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yurest')
        .setDescription('Yurestm for Roleplay')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('intitial yurest')
                .addChannelOption(option => option.setName('channel').setDescription('Feed Channel for Posts').setRequired(true).addChannelTypes(ChannelType.GuildText))
                .addRoleOption(option => option.setName('role').setDescription('Roleplayerrole').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('edit global Yurest settings')
                .addChannelOption(option => option.setName('channel').setDescription('Feed Channel for Posts').addChannelTypes(ChannelType.GuildText))
                .addRoleOption(option => option.setName('role').setDescription('Roleplayerrole')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('profile_create')
                .setDescription('create a new profile for a Char')
                .addStringOption(option => option.setName('username').setDescription('Name of profile').setRequired(true))
                .addAttachmentOption(option => option.setName('media').setDescription('Picture for the Profile').setRequired(true))
                .addStringOption(option => option.setName('charname').setDescription('Name of character').setRequired(true))
                .addStringOption(option => option.setName('biography').setDescription('Biography for profile').setRequired(true))
                .addBooleanOption(option => option.setName('private').setDescription('If the profile should be private = true').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('profile_edit')
                .setDescription('edit exsisting profile for a Char')
                .addStringOption(option => option.setName('username').setDescription('Name of profile'))
                .addAttachmentOption(option => option.setName('media').setDescription('Picture for the Profile'))
                .addStringOption(option => option.setName('biography').setDescription('Biography for profile'))
                .addBooleanOption(option => option.setName('private').setDescription('If the profile should be private = true')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('profile_delete')
                .setDescription('delete a profile')
                .addStringOption(option => option.setName('username').setDescription('Name of profile').setRequired(true))
                .addStringOption(option => option.setName('charname').setDescription('Name of character').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('post_create')
                .setDescription('create a new post')
                .addStringOption(option => option.setName('username').setDescription('Name of profile').setRequired(true))
                .addStringOption(option => option.setName('text').setDescription('Text to post'))
                .addAttachmentOption(option => option.setName('media').setDescription('Picture to post')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('post_delete')
                .setDescription('create a new post')
                .addStringOption(option => option.setName('username').setDescription('Name of profile').setRequired(true))
                .addIntegerOption(option => option.setName('id').setDescription('Id of the post').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('search in Yurest')
                .addStringOption(option => option.setName('text').setDescription('username, charname or text to search').setRequired(true))),
    async execute(interaction) {
        // setup ausnehmen und funktion in db.js schreiben
        if (!interaction.member.roles.cache.has(db.getyurestRole(interaction.guildId)))
            return interaction.reply({ embeds: [dc.sEmbed('Rolle fehlt', 'Du hast nicht die benötigten Berechtigungen', 'Tesh-Bot', '0xaaeeff')] });
        switch (interaction.options.getSubcommand()) {
            case 'setup':
                db.insertModule('yurest', true, interaction.guildId, { channel: interaction.options.getChannel('channel').id, role: interaction.getRole('role').id });
                await interaction.reply({ embeds: [dc.sEmbed('Yurest', 'DYurest wurde erstellt und steht nun zuur Verfügung.', 'Tesh-Bot', '0xaaeeff')] });
                break;
            case 'edit':
                let configs = db.getModuleConfig('yurest', interaction.guildId);
                if (interaction.options.getChannel('channel') != undefined)
                    configs.channel = interaction.options.getChannel('channel');
                if (interaction.options.getRole('role') != undefined)
                    configs.role = interaction.options.getRole('role');
                db.updateModuleConfig('yurest', interaction.guildId, configs);
                await interaction.reply({ embeds: [dc.sEmbed('Yurest', `Die Einstellungen wurden auf\nFeed: ${configs.channel}\nRolle: ${configs.role} geändert`, interaction.guild.name, '0xaaeeff')] });
                break;
            case 'profile_create':
                db.insertYurestProfile(interaction.guildId, interaction.user.id, interaction.options.getString('charname'), interaction.options.getString('username'), interaction.options.getString('biography'), interaction.options.getBoolean('private'), interaction.options.getAttachment('media').url);
                const data = db.getYurestProfile(interaction.guildId, interaction.options.getString('username'));
                await interaction.reply({ embeds: [dc.sEmbed('Yurest', 'dein profil wurde erstellt\n' + data.media, 'Tesh-Bot', '0xaaeeff')] });
                break;
            case 'profile_edit':
                db.updateYurestProfile(interaction.guildId, interaction.user.id, interaction.options.getString('username'), interaction.options.getString('biography'), interaction.options.getBoolean('private'), interaction.options.getAttachment('media'));
                await interaction.reply({ embeds: [dc.sEmbed('Yurest', 'dein profil wurde bearbeitet', 'Tesh-Bot', '0xaaeeff')] });
                break;
            case 'profile_delete':
                db.deleteYurestProfile(interaction.guildId, interaction.user.id, interaction.options.getString('username'), interaction.options.getString('charname'));
                await interaction.reply({ embeds: [dc.sEmbed('Yurest', 'dein profil wurde gelöscht', 'Tesh-Bot', '0xaaeeff')] });
                break;
            case 'post_create':
                db.insertYurestPost(interaction.guildId, interaction.user.id, interaction.options.getString('charname'), interaction.options.getString('text'), interaction.options.getAttachment('media'));
                await interaction.reply({ embeds: [dc.sEmbed('Yurest', 'dein profil wurde erstellt', 'Tesh-Bot', '0xaaeeff')] });
                break;
            case 'post_delete':
                db.deleteYurestPost(interaction.guildId, interaction.user.id, interaction.options.getInteger('id'));
                await interaction.reply({ embeds: [dc.sEmbed('Yurest', 'dein profil wurde erstellt', 'Tesh-Bot', '0xaaeeff')] });
                break;
            case 'search':
                await interaction.reply({ embeds: [dc.sEmbed('Yurest', 'es wird gesucht ...', 'Tesh-Bot', '0xaaeeff')] });
                db.getYurestSearch(interaction.guildId, interaction.user.id, interaction.options.getInteger('text'));
                interaction.editReply({ embeds: [dc.sEmbed('Yurest', 'es wird gesucht ....', 'Tesh-Bot', '0xaaeeff')] });
                break;
        }
    }
};