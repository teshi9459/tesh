const db = require('../../libs/db');
const dc = require('../../libs/dc');
const { userMention, channelMention, codeBlock } = require('discord.js');
module.exports = {
    name: 'words',
    async execute(msg) {
        if (msg.content.startsWith('(') || msg.content.endsWith(')')) return;
        if (!db.checkChannel(msg.channel.parentId, msg.guildId)) return;
        const l = this.count(msg.content);
        const config = db.getModuleConfig(this.name, msg.guildId);
        if (l > config.min && l < config.max) {
            let reports = db.getWords(msg.author.id, msg.guildId);
            let report;
            report = this.newReport(msg, l, config.max, reports.length);
            reports.push(report);
            if (reports.length <= 1)
                db.insertWords(msg.author.id, msg.guildId, reports);
            else
                db.updateWords(msg.author.id, msg.guildId, reports);
            if (config.warning)
                msg.channel.send({ content: userMention(msg.author.id), embeds: [dc.sEmbed('Zu wenig Wörter', `Du hast **${report.diff} Wörter zu wenig** geschrieben.\nBitte achte in Zukunft **mindestens ${config.max} Wörter** zu schreiben.\nWenn mir ein Fehler unterlaufen ist, melde dich bitte beim Team.\nViel Spaß im weiteren RP!`, `Wird nach 10min gelöscht | Report: ${report.reportsBefore + 1}`, '0xd50707')] }).then((info) => {
                    setTimeout(function () {
                        info.delete();
                    }, 600000);
                }
                );
            dc.getChannel(msg, config.channel).send({
                embeds: [dc.sEmbed('Neuer Report', userMention(msg.author.id) + ' in ' + channelMention(msg.channel.id) + '\n' + codeBlock(msg.content), 'Neuer Report | Tesh-Bot Words-Modul', '0xaaeeff').addFields(
                    { name: 'Wörter:', value: report.length + '', inline: true },
                    { name: 'Differenz:', value: report.diff + '', inline: true },
                    { name: 'Reports:', value: report.reportsBefore + 1 + '', inline: true },
                    { name: 'Link', value: report.link + '', inline: false })
                ]
            });
        }
    },
    newReport: function (msg, l, max, reps) {
        return {
            id: msg.id,
            content: msg.content,
            link: msg.url,
            channel: msg.channel,
            user: msg.author.id,
            length: l,
            diff: max - l,
            reportsBefore: reps
        };
    },
    count: function (text) {
        return text.split(' ').length;
    }

};
