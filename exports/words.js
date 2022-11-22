const db = require('../libs/db');
const dc = require('../libs/dc');
const { userMention, channelMention, codeBlock } = require('discord.js');
module.exports = {
    name: 'words',
    content: 'msg',
    async execute(msg) {
        if (msg.content.startsWith('(') || msg.content.endsWith(')')) return;
        //channel return, msg handler, channel commands
        const l = this.count(msg.content)
        const config = db.getModuleConfig(this.name, msg.guildId);
        let reports = db.getWords(msg.author.id, msg.guildId);
        let report;
        if (l > config.min && l < config.max)
            report = this.newReport(msg, l, config.max, reports.length);
        reports.push(report);
        db.updateWords(reports, msg.author.id, msg.guildId);
        if (config.warning)
            msg.channel.send({ conten: userMention(msg.author.id), embeds: [dc.sEmbed('Zu wenig Wörter', `Du hast **${report.diff} Wörter zu wenig** geschrieben.\nBitte achte in Zukunft **mindestens ${config.max} Wörter** zu schreiben.\nWenn mir ein Fehler unterlaufen ist, melde dich bitte beim Team.\nViel Spaß im weiteren RP!`, `Wird nach 10min gelöscht | Report: ${report.reportsBefore}`, '0xd50707')] }).then(info =>
                setTimeout((info) => info.delete(), 600000)
            );
        dc.getChannel(msg, config.channel).send({
            embeds: [dc.sEmbed(userMention(msg.author.id) + ' in ' + channelMention(msg.channel.id), codeBlock(msg.content), 'Neuer Report | Tesh-Bot Words-Modul', '0xaaeeff').addFields({ name: 'Daten:', value: `Wörter: ${report.length} | Differenz: ${report.diff}`, inline: true }).addFields({ name: 'Reports:', value: report.reportsBefore, inline: true }).addFields({ name: 'Link', value: report.link, inline: false })]
        });
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
