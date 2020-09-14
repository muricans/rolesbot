const fs = require('fs');
const Discord = require('discord.js');
const rolebot = require('../rolebot');

module.exports = {
    name: 'registermessage',
    description: 'Will create a role react on the messageId provided in the channel.',
    usage: '<messageId> <role> [addEmoji|channelId] [removeEmoji|addEmoji] [removeEmoji]',
    args: true,
    minArgs: 2,
    permissions: ['MANAGE_GUILD'],
    /**
     * 
     * @param {*} message 
     * @param {*} args 
     * @param {Discord.Client} client 
     */
    async execute(message, args, client) {
        const messageId = args[0];
        const messages = JSON.parse(fs.readFileSync("./messages.json", 'utf8'));
        const guild = await client.guilds.fetch(message.guild.id);
        const role = guild.roles.cache.find(r => r.name === (args[1].split('_').join(' ')) || r.id === args[1]);

        if (!role) return message.channel.send(`${message.author} I could not find a role with the name of '${args[1]}' on this server!`);

        let emojiAdd = '✅';
        let emojiRemove = '❌';
        let channel = message.channel;
        // check if argument is a channel, if it is, then set up emojis to be 4th and 5th argument to be emojis.
        if (rolebot.channelResolvable(args[2])) {
            channel = rolebot.parseChannel(args[2]);
            emojiAdd = args[3] ? args[3] : emojiAdd;
            emojiRemove = args[4] ? args[4] : emojiRemove;
        } else {
            // argument is not a channel, set up 3rd and 4th argument to be emojis.
            emojiAdd = args[2] ? args[2] : emojiAdd;
            emojiRemove = args[3] ? args[3] : emojiRemove;
        }

        channel.messages.fetch(messageId, true).then(async m => {
            // check if there is already a reaction role attached to the message id given.
            const exists = messages.ids.find(v => v.messageId === messageId && v.channelId === channel.id);
            if (exists) return message.channel.send('There is already a role reaction attached to that message in this channel!');

            // check if emojis are EmojiResolvabes
            let invalid = false;
            await m.react(emojiAdd).catch(() => invalid = true);
            await m.react(emojiRemove).catch(() => invalid = true);
            if (invalid) return message.channel.send(`${message.author} You used an invalid emoji!`);

            messages.ids.push({
                messageId: messageId,
                channelId: channel.id,
                roleId: role.id,
                guildId: m.guild.id,
                emojiAddId: emojiAdd,
                emojiRemoveId: emojiRemove,
            });

            fs.writeFile('./messages.json', JSON.stringify(messages), (err) => {
                if (err) console.log(err);
                collectReactions(m, role, client, emojiAdd, emojiRemove);
                message.channel.send(`${message.author} Successfully added role reaction to message with id of '${messageId}' in channel '${channel.name}'`);
            });
        }).catch(() => message.channel.send(`${message.author} I could not find a message with an id of '${messageId}' on the channel '${channel.name}'!`));
    },
    collectReactions: collectReactions,
    collections: new Discord.Collection(),
};

function collectReactions(message, role, client, emojiAdd, emojiRemove) {
    const collection = message.createReactionCollector((reaction, user) => reaction.emoji.name === emojiAdd || reaction.emoji.name === emojiRemove && user.id !== client.user.id);
    collection.on('collect', (reaction, user) => {
        reaction.users.remove(user);
        if (user.bot) return;
        const guildMember = message.guild.member(user);
        if (reaction.emoji.name === emojiAdd) {
            if (guildMember.roles.cache.array().find(r => r.id === role.id)) return;
            guildMember.roles.add(role);
        } else {
            if (!(guildMember.roles.cache.array().find(r => r.id === role.id))) return;
            guildMember.roles.remove(role);
        }
    });
    module.exports.collections.set(`${message.id}:${message.channel.id}`, collection);
}