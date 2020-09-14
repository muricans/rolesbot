const fs = require('fs');
const rolebot = require('../rolebot');

module.exports = {
    name: 'purge',
    description: 'Deletes all reaction roles currently active in the server.',
    permissions: ['MANAGE_GUILD'],
    execute(message) {
        fs.writeFile("./messages.json", JSON.stringify({
            ids: [],
        }), err => {
            if (err) return console.log(err);
            rolebot.refreshActiveMessages().then(() => {
                message.channel.send(`${message.author} All reaction messages have been purged.`);
            }).catch(err => {
                message.channel.send(`${message.author} Error: ${err.name}`);
            });
        });
    },
};