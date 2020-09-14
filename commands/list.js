const rolebot = require('../rolebot');
const fs = require('fs');

module.exports = {
    name: 'list',
    description: 'Refreshes and lists all currently active role react messages.',
    permissions: ['MANAGE_GUILD'],
    execute(message) {
        rolebot.refreshActiveMessages();
        const messages = JSON.parse(fs.readFileSync('./messages.json', 'utf-8'));
        const list = [];
        for (const m of messages.ids) {
            list.push(`Message ID: ${m.messageId} | Channel ID: ${m.channelId} | Role ID: ${m.roleId}`);
        }
        const toSend = list.length > 0 ? list.join('\n') : 'No messages are currently registered!';
        message.channel.send(toSend);
    },
};