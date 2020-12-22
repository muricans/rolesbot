const fs = require('fs');
const {
    get,
} = require('https');

module.exports = {
    name: 'registermultimessage',
    description: 'Registers a message that lets you pick between multiple options with different emojis',
    usage: '<messageId> <jsonFile>',
    args: true,
    minArgs: 1,
    permissions: ['MANAGE_GUILD'],
    async execute(message, args) {
        const messageId = args[0];
        const messages = JSON.parse(fs.readFileSync("./messages.json", 'utf8'));

        if (messages.multi.find(v => v.id === messageId) || messages.ids.find(v => v.messageId === messageId))
            return message.channel.send('There is already a role reaction attached to that message in this channel!');

        if (!message.attachments.first()) return message.channel.send('Please attacha JSON file to read from!');

        const multiMessage = await readJSON(message.attachments.first().url);
        const guild = message.guild;
        let invalidRole = false;
        for (const roleId of Object.values(multiMessage)) {
            const role = guild.roles.cache.find(r => r.name === (roleId.split('_').join(' ')) || r.id === roleId);
            if (!role) {
                message.channel.send(`The role, ${roleId}, could not be found on this guild!`);
                invalidRole = true;
                break;
            }
        }
        if (invalidRole) return;

        const channel = message.channel;
        channel.messages.fetch(messageId, true).then(async m => {
            let invalidEmoji = false;
            for (const emojiId of Object.keys(multiMessage)) {
                try {
                    await m.react(emojiId);
                } catch (err) {
                    invalidEmoji = true;
                    break;
                }
            }
            if (invalidEmoji) return message.channel.send(`${message.author} You used an invalid emoji!`);

            messages.multi.push({
                id: messageId,
                guild: guild.id,
                channel: channel.id,
                roles: multiMessage,
            });
            fs.writeFile('./messages.json', JSON.stringify(messages), (err) => {
                if (err) console.log(err);
                message.channel.send(`${message.author} Successfully added role reaction to message with id of '${messageId}' in channel '${channel.name}'`);
            });
        }).catch(() => message.channel.send(`${message.author} I could not find a message with an id of '${messageId}' on the channel '${channel.name}'!`));
    },
};

async function readJSON(url) {
    return new Promise(resolve => {
        get(url, (resp) => {
            const chunks = [];
            resp.on('data', (chunk) => {
                chunks.push(chunk);
            });
            resp.on('end', () => {
                const body = Buffer.concat(chunks);
                const parsed = JSON.parse(body.toString());
                resolve(parsed);
            });
        }).end();
    });
}