const db = require('../../libs/db');
const dc = require('../../libs/dc');
const { userMention, channelMention, codeBlock } = require('discord.js');
module.exports = {
    name: 'words',
    async execute(msg) {
        if (msg.content.startsWith('(') || msg.content.endsWith(')')) return;
        if (!await db.checkChannel(msg.channel.parentId, msg.guildId)) return;
        const l = this.count(msg.content);
        const config = await db.getWordsConfig(msg.guildId);
        if (l > config.min && l < config.max) {
            const report = this.newReport(msg, l, config.max);
            await db.insertReport(msg.guildId, msg.author.id, "words", this.newReportContent(l, config.max), JSON.stringify(report));
            const reports = await db.countActiveReports(msg.guildId, msg.author.id);
            if (config.warning)
                msg.channel.send({ content: userMention(msg.author.id), embeds: [dc.sEmbed('Zu wenig Wörter', `Du hast **${report.diff} Wörter zu wenig** geschrieben.\nBitte achte in Zukunft **mindestens ${config.max} Wörter** zu schreiben.\nWenn mir ein Fehler unterlaufen ist, melde dich bitte beim Team.\nViel Spaß im weiteren RP!`, `Wird nach 10min gelöscht | Report: ${reports.length + 1}`, '0xd50707')] }).then((info) => {
                    setTimeout(function () {
                        info.delete();
                    }, 600000);
                }
                );
            dc.getChannel(msg, config.channel).send({
                embeds: [dc.sEmbed('Neuer Report', userMention(msg.author.id) + ' in ' + channelMention(msg.channel.id) + '\n' + codeBlock(msg.content), 'Neuer Report | Tesh-Bot Words-Modul', '0xaaeeff').addFields(
                    { name: 'Wörter:', value: report.length + '', inline: true },
                    { name: 'Differenz:', value: report.diff + '', inline: true },
                    { name: 'Reports:', value: reports.length + 1 + '', inline: true },
                    { name: 'Link', value: report.link + '', inline: false })
                ]
            });
        }
    },
    newReport: function (msg, l, max) {
        return {
            message: msg.id,
            content: msg.content,
            link: msg.url,
            channel: msg.channel,
            length: l,
            diff: max - l
        };
    },
    newReportContent: function (l, max) {
        return `Report auf Grund der Differenz von ${max - l} Wörtern in einer Rp-Nachricht.`;
    },
    count: function (text) {
        return text.split(' ').length;
    }

};
