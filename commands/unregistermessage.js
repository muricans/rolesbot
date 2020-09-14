const fs = require('fs');
const registermessages = require('./registermessage');
const rolebot = require('../rolebot');

module.exports = {
    name: 'unregistermessage',
    description: 'Removes role react on the specified messageId in the channel.',
    usage: '<messageId> [channelId]',
    args: true,
    minArgs: 1,
    permissions: ['MANAGE_GUILD'],
    execute(message, args) {
        const messageId = args[0];
        const channel = rolebot.parseChannel(args[1]) || message.channel;
        deleteReactionMessage(messageId, channel.id, (err) => {
            if (err) return message.channel.send(`${message.author} Error: ${err}`);
            registermessages.collections.get(`${messageId}:${channel.id}`).stop();
            registermessages.collections.delete(`${messageId}:${channel.id}`);
            message.channel.send(`Successfully deleted role react on message with id of ${messageId}`);
        });
    },
    deleteReactionMessage: deleteReactionMessage,
};

function deleteReactionMessage(messageId, channelId, callback) {
    fs.readFile('./messages.json', (err, data) => {
        if (err) return console.log(err);
        const messages = JSON.parse(data);
        let index = messages.ids.find(v => v.messageId === messageId && v.channelId === channelId);
        if (index) {
            index = messages.ids.indexOf(index);
            messages.ids.splice(index, 1);
            fs.writeFile('./messages.json', JSON.stringify(messages), err => {
                if (err) return console.log(err);
                if (callback)
                    callback();
            });
        } else if (callback) {
            callback(`I could not find a message with an id of '${messageId}' in channel '${channelId} that has a role reaction attached to it!'`);
        }
    });
}