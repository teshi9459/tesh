const fs = require('fs');
const db = require('../libs/db');
const { once } = require('events');
module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message) {
        if (message.author.bot) return;
        message.client.plugins.forEach(plugin => {
            if (plugin.enabled && plugin.messages) plugin.executeMessage(message);
        });
    },
};