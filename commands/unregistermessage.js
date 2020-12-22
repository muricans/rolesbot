const fs = require('fs');
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
        deleteReactionMessage(messageId, channel.id, message.guild.id, (err) => {
            if (err) return message.channel.send(`${message.author} Error: ${err}`);
            message.channel.send(`Successfully deleted role react on message with id of ${messageId}`);
        });
    },
    deleteReactionMessage: deleteReactionMessage,
};

function deleteReactionMessage(messageId, channelId, guildId, callback) {
    fs.readFile('./messages.json', (err, data) => {
        if (err) return console.log(err);
        const messages = JSON.parse(data);
        let index = messages.ids.find(v => v.messageId === messageId && v.channelId === channelId && v.guildId === guildId);
        const multi = messages.multi.find(v => v.id === messageId && v.channel === channelId && v.guild === guildId);
        if (index) {
            index = messages.ids.indexOf(index);
            messages.ids.splice(index, 1);
            fs.writeFile('./messages.json', JSON.stringify(messages), err => {
                if (err) return console.log(err);
                if (callback)
                    callback();
            });
        } else if (multi) {
            index = messages.multi.indexOf(multi);
            messages.multi.splice(index, 1);
            fs.writeFile('./messages.json', JSON.stringify(messages), err => {
                if (err) return console.log(err);
                if (callback)
                    callback();
            });
        } else if (callback) {
            callback(`I could not find a message with an id of '${messageId}' in channel '${channelId}' (part of guild: '${guildId}') that has a role reaction attached to it!'`);
        }
    });
}