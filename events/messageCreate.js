const fs = require('fs');
const db = require('../libs/db');
module.exports = {
    name: 'messageCreate',
    execute(message) {
        if (message.author.bot) return;
        const commandFiles = fs.readdirSync('./exports/message/').filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const modul = require(`../exports/message/${file}`);
            if (!db.checkModule(file.slice(0, file.length - 3), message.guildId)) return;
            try {
                modul.execute(message);
            } catch (error) {
                console.error(error);
                message.reply('Ein Fehler ist aufgetreten qwq\n*kontaktiere den Developer*');
            }
        }
    },
};