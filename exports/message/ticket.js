const db = require('../../libs/db');
const dc = require('../../libs/dc');
const { channelMention, AttachmentBuilder, ActionRowBuilder, ChannelType, PermissionsBitField, userMention, codeBlock, bold } = require('discord.js');
const interactionCreate = require('../../events/interactionCreate');
module.exports = {
    name: 'ticket',
    async execute(msg) {
        if (!await db.checkTicketChannel(msg.channel.id, msg.guildId)) return;
        const content = JSON.parse(await db.getTicketContent(msg.channel.id, msg.guildId));
        content.messages.push(msg.id);
        db.updateTicketContent(msg.channel.id, msg.guildId, content);
    },
    gotButton: async function (i, action, id) {
        //add await
        if (!i.member.roles.cache.has(await db.getGuildRole(i.guildId)) && action != 'create')
            return i.reply({ content: 'das kannst du leider nicht', ephemeral: true });

        switch (action) {
            case 'create':
                this.createTicket(i, id);
                break;
            case 'close':
                if (!i.member.id == await db.getTicketUser(i.channel.id, i.guildId).user)
                    return i.reply({ content: 'das kannst du leider nicht', ephemeral: true });
                this.closeTicket(i);
                break;
            case 'public':
                this.viewTicket(i, false);
                break;
            case 'private':
                this.viewTicket(i, true);
                break;
            default:
                break;
        }
    },
    createTicket: async function (i, panelId) {
        const pannel = await db.getTicketPanel(panelId, i.guildId);
        const guildRole = await db.getGuildRole(i.guildId);
        let row = new ActionRowBuilder().addComponents(dc.createButton('ticket.close.0', '✖ Close', 'Danger'));
        row.addComponents(dc.createButton('ticket.private.0', '🔒 Privat', 'Secondary', undefined, undefined, true)).addComponents(dc.createButton('ticket.public.0', '🔓 Öffentlich', 'Secondary'));
        i.guild.channels.create({
            name: '🆕-' + i.user.username,
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
                    allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: guildRole,
                    allow: [PermissionsBitField.Flags.SendMessages],
                },
            ],
        })
            .then(ticket => {
                db.insertTicket(ticket.id, i.user.id, i.guildId, pannel.log);
                ticket.send({ embeds: [dc.sEmbed('__Ticket__', pannel.text, 'Tesh-Bot Ticket System', '0xaaeeff')], components: [row] });
                i.reply({ content: 'weitere Infos in deinem Ticket: ' + channelMention(ticket.id), ephemeral: true });
                ticket.edit({ name: `🆕-${i.user.username}-ticket` });
            })
            .catch(console.error);

    },
    closeTicket: function (interaction) {
        let row = new ActionRowBuilder().addComponents(dc.createButton('ticket.open.' + interaction.channel.id, '↺ Open', 'Success'));
        interaction.reply({ embeds: [dc.sEmbed('__Ticket Geschlossen__', `Das Ticket wurde von ${interaction.user} geschlossen.\nEs wird in 15min archiviert und der Channel gelöscht.`, 'Tesh-Bot Ticket System', '0xd60000')], components: [row] });

        let open = true;
        const filter = i => i.customId === `ticket.open.${interaction.channel.id}`;
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15 * 60 * 1000
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
            async collected => {
                if (open) {
                    const dbLog = await db.getTicketLog(interaction.channel.id, interaction.guildId);
                    const log = interaction.guild.channels.cache.find(c => c.id == dbLog);
                    db.closeTicket(interaction.channel.id, interaction.guildId);
                    const userT = await db.getTicketUser(interaction.channel.id, interaction.guildId);
                    log.send({
                        embeds: [dc.sEmbed('Ticket geschlossen', bold(interaction.channel.name) + `\n\nDas Ticket von ${userMention(userT)} wurde von ${interaction.user} geschlossen.`, 'Tesh-Bot Ticket System', '0xd60000')]
                    });
                    setTimeout(function () {
                        interaction.channel.delete();
                    }, 5 * 1000);
                }
            });


    },
    //not used
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
