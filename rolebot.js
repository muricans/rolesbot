const Discord = require('discord.js');
const settings = require('./settings.json');
const pkg = require('./package.json');
const commands = require('./commands');
const fs = require('fs');

module.exports = {
    parseChannel(channel) {
        if (!channel) return undefined;
        if (channel.startsWith('<#') && channel.endsWith('>')) {
            channel = channel.slice(2, -1);
            if (channel.startsWith('!'))
                channel = channel.slice(1);
            return client.channels.cache.get(channel);
        }
    },
    channelResolvable(channel) {
        if (!channel) return undefined;
        if (channel.startsWith('<#') && channel.endsWith('>')) return true;
        return false;
    },
};

const client = new Discord.Client();
client.commands = new Discord.Collection();

function scan(dir, collection) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        fs.stat(`${dir}/${file}`, (err, stats) => {
            if (err) return;
            if (!stats.isDirectory() && file.endsWith('.js')) {
                const cmd = require(`${dir}/${file}`);
                collection.set(cmd.name, cmd);
            } else if (stats.isDirectory()) {
                scan(`${dir}/${file}`, collection);
            }
        });
    }
}

scan('./commands', client.commands);
client.once('ready', () => {
    console.log(`${pkg.name}@${pkg.version} has started.`);
    client.generateInvite(8).then(link => {
        console.log(link);
    });
    commands.register(client);
});

client.on('ready', () => {
    fs.readFile('./messages.json', 'utf-8', (err, data) => {
        if (err) return console.log(err);
        const messages = JSON.parse(data);
        messages.ids.map(m => {
            const channel = client.channels.cache.get(m.channelId);
            if (channel instanceof Discord.TextChannel)
                channel.messages.fetch(m.messageId, true);
        });
        messages.multi.map(m => {
            const channel = client.channels.cache.get(m.channel);
            if (channel instanceof Discord.TextChannel)
                channel.messages.fetch(m.id, true);
        });
    });
});

client.on('messageDelete', message => {
    fs.readFile('./messages.json', 'utf-8', async (err, data) => {
        if (err) return console.log(err);
        const messages = JSON.parse(data);
        let index = messages.ids.find(m => m.messageId === message.id && m.channelId === message.channel.id &&
            m.guildId === message.guild.id);
        if (index) {
            index = messages.ids.indexOf(index);
            messages.ids.splice(index, 1);
            fs.writeFile("./messages.json", JSON.stringify(messages), err => console.log(err));
        }
    });
});

client.on('messageReactionAdd', (reaction, user) => {
    //console.log(reaction.emoji, reaction.emoji.name, reaction.emoji.id);
    if (user.bot) return;
    fs.readFile('./messages.json', 'utf-8', async (err, data) => {
        if (err) return console.log(err);
        const messages = JSON.parse(data);
        const reactionMessage = messages.ids.find(m => m.messageId === reaction.message.id && m.channelId === reaction.message.channel.id &&
            m.guildId === reaction.message.guild.id);
        const multiMessage = messages.multi.find(m => m.id === reaction.message.id && m.guild === reaction.message.guild.id && m.channel === reaction.message.channel.id);
        if (reactionMessage) {
            await reaction.users.remove(user);
            let guildMember = reaction.message.guild.member(user);
            if (!guildMember) guildMember = await reaction.message.guild.members.fetch(user);
            const role = await reaction.message.guild.roles.fetch(reactionMessage.roleId);
            if (reaction.emoji.name === reactionMessage.emojiAddId) {
                if (guildMember.roles.cache.array().find(r => r.id === role.id)) return;
                guildMember.roles.add(role);
            } else if (reaction.emoji.name === reactionMessage.emojiRemoveId) {
                if (!(guildMember.roles.cache.array().find(r => r.id === role.id))) return;
                guildMember.roles.remove(role);
            }
        } else if (multiMessage) {
            await reaction.users.remove(user);
            let guildMember = reaction.message.guild.member(user);
            if (!guildMember) guildMember = await reaction.message.guild.members.fetch(user);
            let roleSelected;
            for (const [key, value] of Object.entries(multiMessage.roles)) {
                if (key === reaction.emoji.name || key === reaction.emoji.id) {
                    roleSelected = value;
                    break;
                }
            }
            if (!roleSelected) return console.log("Could not find role selected!");
            const role = await reaction.message.guild.roles.fetch(roleSelected);
            if (guildMember.roles.cache.array().find(r => r.id === role.id)) await guildMember.roles.remove(role);
            else await guildMember.roles.add(role);
        }
    });
});

client.login(settings.token);