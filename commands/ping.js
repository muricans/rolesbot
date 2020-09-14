module.exports = {
    name: 'ping',
    description: 'Pings the bot',
    execute(message) {
        message.channel.send(`${message.author} Pong!`);
    },
};