const db = require('../../libs/db');
const dc = require('../../libs/dc');
const { roleMention, channelMention, AttachmentBuilder, ActionRowBuilder, ChannelType, PermissionsBitField, userMention } = require('discord.js');
const interactionCreate = require('../../events/interactionCreate');
module.exports = {
    name: 'ticket',
    async execute(msg) {
        if (!db.checkTicketChannel(msg.channel.id, msg.guildId)) return;
        const content = db.getTicketContent(msg.channel.id, msg.guildId);
        content.data.push(msg.id);
        db.updateTicketContent(msg.channel.id, msg.guildId, content);
    },
    gotButton: function (i, action, id) {
        switch (action) {
            case 'create':
                this.createTicket(i, id);
                break;
            case 'close':
                if (!i.member.roles.cache.has(db.getGuildRole(i.guildId) || !i.member.id == db.getTicket(i.channel.id, i.guildId).user))
                    return i.reply({ content: 'das kannst du leider nicht', ephemeral: true });
                this.closeTicket(i);
                break;
            case 'public':
                if (!i.member.roles.cache.has(db.getGuildRole(i.guildId)))
                    return i.reply({ content: 'das kannst du leider nicht', ephemeral: true });
                this.viewTicket(i, false);
                break;
            case 'private':
                if (!i.member.roles.cache.has(db.getGuildRole(i.guildId)))
                    return i.reply({ content: 'das kannst du leider nicht', ephemeral: true });
                this.viewTicket(i, true);
                break;
            default:
                break;
        }
    },
    createTicket: function (i, pannelId) {
        const pannel = db.getPannel(pannelId);
        const config = db.getModuleConfig('ticket', i.guildId);
        let row = new ActionRowBuilder().addComponents(dc.createButton('ticket.close.0', '✖ Close', 'Danger'));
        switch (pannel.type) {
            case 'char':
                i.guild.channels.create({
                    name: '🆕-abgabe',
                    type: ChannelType.GuildText,
                    reason: 'neues Ticket',
                    parent: pannel.category,
                    permissionOverwrites: [
                        {
                            id: i.guild.id,
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: i.user.id,
                            allow: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: config.role,
                            allow: [PermissionsBitField.Flags.SendMessages],
                        },
                    ],
                })
                    .then(ticket => {
                        db.insertTicket(ticket.id, 'char', i.user.id, i.guildId);
                        ticket.send({ embeds: [dc.sEmbed('__Steckbrief Abgabe__', 'Bitte schicke hier dein Steckbrief rein. Du kannst ihn noch in Ruhe bearbeiten. Wenn du fertig bist **Pinge bitte ' + roleMention(config.role) + '**, damit wir mit der Abnahme starten können.', 'Tesh-Bot Ticket System', '0xaaeeff')], components: [row] });
                        i.reply({ content: 'weitere Infos in deinem Ticket: ' + channelMention(ticket.id), ephemeral: true });
                        ticket.edit({ name: `🆕-${db.getTicketId(ticket.id, i.guild.id)}-${i.user.username}` });
                    })
                    .catch(console.error);
                break;
            case 'team':
                i.guild.channels.create({
                    name: '🆕-bewerbung',
                    type: ChannelType.GuildText,
                    reason: 'neues Ticket',
                    parent: pannel.category,
                    permissionOverwrites: [
                        {
                            id: i.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: i.user.id,
                            allow: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: config.role,
                            allow: [PermissionsBitField.Flags.SendMessages],
                        },
                    ],
                })
                    .then(ticket => {
                        db.insertTicket(ticket.id, 'team', i.user.id, i.guildId);
                        ticket.send({ embeds: [dc.sEmbed('__Bewerbung__', 'Bitte schicke hier deine Bewerbung rein. Du kannst sie noch in Ruhe bearbeiten. Wenn du fertig bist **Pinge bitte ein Team Mitglied**, damit wir mit der Bewerbung starten können.', 'Tesh-Bot Ticket System', '0xaaeeff')], components: [row] });
                        i.reply({ content: 'weitere Infos in deinem Ticket: ' + channelMention(ticket.id), ephemeral: true });
                        ticket.edit({ name: `🆕-${db.getTicketId(ticket.id, i.guild.id)}-${i.user.username}` });
                    })
                    .catch(console.error);
                break;
            case 'supp':
                row.addComponents(dc.createButton('ticket.private.0', '🔒 Privat', 'Secondary', undefined, undefined, true)).addComponents(dc.createButton('ticket.public.0', '🔓 Öffentlich', 'Secondary'));
                i.guild.channels.create({
                    name: '🆕-support',
                    type: ChannelType.GuildText,
                    reason: 'neues Ticket',
                    parent: pannel.category,
                    permissionOverwrites: [
                        {
                            id: i.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: i.user.id,
                            allow: [PermissionsBitField.Flags.SendMessages],
                        },
                        {
                            id: config.role,
                            allow: [PermissionsBitField.Flags.SendMessages],
                        },
                    ],
                })
                    .then(ticket => {
                        db.insertTicket(ticket.id, 'supp', i.user.id, i.guildId);
                        ticket.send({ embeds: [dc.sEmbed('__Support Ticket__', 'Bitte schicke dein Anliegen hier rein. Du kannst deine Nachricht noch in Ruhe bearbeiten. Wenn du fertig bist **Pinge bitte das Team oder dein Ansprechpartner**, dann können wir schauen wie wir dir helfen können.', 'Tesh-Bot Ticket System', '0xaaeeff')], components: [row] });
                        i.reply({ content: 'weitere Infos in deinem Ticket: ' + channelMention(ticket.id), ephemeral: true });
                        ticket.edit({ name: `🆕-${db.getTicketId(ticket.id, i.guild.id)}-${i.user.username}` });
                    })
                    .catch(console.error);
                break;
            default:
                break;
        }

    },
    closeTicket: function (interaction) {
        let row = new ActionRowBuilder().addComponents(dc.createButton('ticket.open.' + interaction.channel.id, '↺ Open', 'Success'));
        interaction.reply({ embeds: [dc.sEmbed('__Ticket Geschlossen__', `Das Ticket wurde von ${interaction.user} geschlossen.\nEs wird in 15min archiviert und der Channel gelöscht.`, 'Tesh-Bot Ticket System', '0xd60000')], components: [row] });
        const ticket = db.getTicket(interaction.channel.id, interaction.guildId);
        const config = db.getModuleConfig('ticket', interaction.guildId);
        //collector
        let open = true;
        const filter = i => i.customId === `ticket.open.${interaction.channel.id}`;
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 0.1 * 60 * 1000
        });
        collector.on('collect',
            async i => {
                i.update({
                    embeds: [dc.sEmbed('__Ticket Wiedereröffnet__', `Das Ticket wurde von ${i.user} geöffnet.`, 'Tesh-Bot Ticket System', '0x0be032')], components: []
                });
                open = false;
                collector.stop();
            });

        collector.on('end',
            collected => {
                if (open) {
                    const log = interaction.guild.channels.cache.find(c => c.id == config.channel);
                    db.closeTicket(ticket.id);
                    log.send({
                        embeds: [dc.sEmbed('Ticket ' + ticket.id + ' geschlossen', `Das Ticket von ${userMention(ticket.user)} wurde von ${interaction.user} geschlossen.\nDie Konversation wurde gespeichert.`, 'Tesh-Bot Ticket System', '0xd60000')], files: [this.getFile(interaction, ticket.content, ticket.user)]
                    });
                    setTimeout(function () {
                        interaction.channel.delete();
                    }, 5 * 1000);
                }
            });


    },
    getFile: function (i, textObj, userid) {
        const data = JSON.parse(textObj).data;
        let text = 'Ticket dokumenierung ' + userid + '\n\n';
        for (const element of data) {
            try {
                const msg = i.channel.messages.cache.find(m => m.id == element);
                text += msg.author.tag + ' -\n' + msg.content + '\n';
            } catch (error) {
                console.log(error);
                text += '#error by fetching message\n';
            }
        }
        text += '\nTesh-Bot Ticket System by teshi#9459';
        const buffer = Buffer.from(text, 'utf-8');
        return new AttachmentBuilder(buffer, { name: 'ticket.txt' });
    },
    viewTicket: function (i, prv) {
        const row = new ActionRowBuilder()
            .addComponents(dc.createButton('ticket.close.0', '✖ Close', 'Danger'))
            .addComponents(dc.createButton('ticket.private.0', '🔒 Privat', 'Secondary', undefined, undefined, prv))
            .addComponents(dc.createButton('ticket.public.0', '🔓 Öffentlich', 'Secondary', undefined, undefined, !prv));
        i.channel.permissionOverwrites.edit(i.guild.id, {
            ViewChannel: !prv,
            SendMessages: !prv
        });
        i.update({
            components: [row]
        });
    }

};
