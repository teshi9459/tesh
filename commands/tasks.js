const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const { userMention } = require('discord.js');
const db = require('../libs/db');
const dc = require('../libs/dc');
const tools = require('../libs/tools');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tasks')
        .setDescription('manage tasks for the team')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('list all tasks'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('new')
                .setDescription('create a task')
                .addStringOption(option => option.setName('task').setDescription('write the tasks content').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('delete a task')
                .addStringOption(option => option.setName('task').setDescription('rewrite the tasks content').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('claims a task for you')
                .addStringOption(option => option.setName('task').setDescription('rewrite the tasks content').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unclaim')
                .setDescription('unclaims you from a task')
                .addStringOption(option => option.setName('task').setDescription('rewrite the tasks content').setRequired(true))),
    async execute(interaction) {
        if (!interaction.member.roles.cache.has(db.getGuildRole(interaction.guildId)))
            return interaction.reply({ embeds: [dc.sEmbed('Rolle fehlt', 'Du hast nicht die benötigten Berechtigungen', 'Tesh-Bot', '0xaaeeff')] });
        switch (interaction.options.getSubcommand()) {
            case 'list':
                const tasks = db.getTeamTasks(interaction.guildId);
                let list = '\n';
                if (tasks === undefined) {
                    list = '*keine Tasks bis jetzt*';
                } else {
                    for (const element of tasks) {
                        let claims = '\n▷ ';
                        element.claims = JSON.parse(element.claims);
                        for (const userid of element.claims.data) {
                            claims += userMention(userid) + ', ';
                        }
                        list += element.id + ' - ' + element.content + claims + '\n'
                    }
                }
                await interaction.reply({ embeds: [dc.sEmbed('Team-Tasks', list, 'Tesh-Bot', '0xaaeeff')] });
                break;
            case 'new':
                db.insertTeamTask(interaction.options.getString('task'), interaction.guildId);
                await interaction.reply({ embeds: [dc.sEmbed('Team-Tasks', 'Es wurde folgende Aufgabe erstellt:\n' + interaction.options.getString('task'), 'Tesh-Bot', '0xaaeeff')], ephemeral: true });
                break;

            case 'delete':
                db.deleteTeamTask(interaction.options.getString('task'), interaction.guildId);
                //tasks id updaten
                let count = 0;
                for (const task of db.getTeamTasks(interaction.guildId)) {
                    count++;
                    db.updateTeamTaskId(task.content, interaction.guildId, count);
                }
                await interaction.reply({ embeds: [dc.sEmbed('Team-Tasks', 'Die folgende Aufgabe wurde gelöscht:\n' + interaction.options.getString('task') + '.', 'Tesh-Bot', '0xaaeeff')], ephemeral: true });
                break;
            case 'claim':
                var claims = db.getTeamTasksClaims(interaction.guildId, interaction.options.getString('task'));
                claims.push(interaction.user.id);
                db.updateTeamTaskClaims(interaction.options.getString('task'), interaction.guildId, claims);
                await interaction.reply({ embeds: [dc.sEmbed('Team-Tasks', 'Du wurdest eingetragen für die Aufgabe:\n' + interaction.options.getString('task') + '.', 'Tesh-Bot', '0xaaeeff')], ephemeral: true });
                break;
            case 'unclaim':
                var claims = db.getTeamTasksClaims(interaction.guildId, interaction.options.getString('task'));
                claims = tools.popA(claims, interaction.user.id);
                db.updateTeamTaskClaims(interaction.options.getString('task'), interaction.guildId, claims)
                await interaction.reply({ embeds: [dc.sEmbed('Team-Tasks', 'Du wurdest ausgetragen von der Aufgabe:\n' + interaction.options.getString('task') + '.', 'Tesh-Bot', '0xaaeeff')], ephemeral: true });
                break;
        }
    }
};