const fs = require('fs');
const db = require('../libs/db');
module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;
        const commandFiles = fs.readdirSync('./exports/message/').filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const modul = require(`../exports/message/${file}`);

            switch (modul.name) {
                case 'words':
                    if (!await db.checkWordsToggle(message.guildId)) continue;
                    break;
                case 'ticket':
                    break;
                default:
                    continue;
                    break;
            }

            try {
                if (!await db.checkUser(message.author.id) && await db.checkGuild(message.guildId)) db.insertUser(message.author.id);
                modul.execute(message);
            } catch (error) {
                console.error(error);
                db.logError('bot', 'msg create', error);
                message.reply('Ein Fehler ist aufgetreten qwq\n*kontaktiere den Developer*');
            }
        }
    },
};