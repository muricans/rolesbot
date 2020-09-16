//TODO: Guild support
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
    refreshActiveMessagesFor(guildId) {
        return new Promise((resolve, reject) => {
            fs.readFile("./messages.json", "utf-8", async (err, data) => {
                if (err) reject(err);
                const messages = JSON.parse(data);
                if (messages.ids.length > 0) {
                    for (const m of messages.ids) {
                        if (m.guldId !== guildId) continue;
                        const guild = await client.guilds.fetch(guildId);
                        const channel = guild.channels.cache.find(v => v.id === m.channelId);
                        if (!(channel instanceof Discord.TextChannel)) continue;
                        channel.messages.fetch(m.messageId).then(async message => {
                            const role = await guild.roles.fetch(m.roleId);
                            if (!(registermessage.collections.get(`${message.id}:${channel.id}:${guildId}`)))
                                registermessage.collectReactions(message, role, client, m.emojiAddId, m.emojiRemoveId);
                        }).catch(() => {
                            unregistermessage.deleteReactionMessage(m.messageId, channel.id, guildId, () => {
                                const regId = `${m.messageId}:${channel.id}:${guildId}`;
                                if (registermessage.collections.get(regId)) {
                                    registermessage.collections.get(regId).stop();
                                    registermessage.collections.delete(regId);
                                }
                            });
                        });
                    }
                } else if (registermessage.collections.size > 0) {
                    registermessage.collections.forEach((collection, key) => {
                        collection.stop();
                        registermessage.collections.delete(key);
                    });
                }
                resolve();
            });
        });
    },
    refreshAllActiveMessages() {
        return new Promise((resolve, reject) => {
            fs.readFile("./messages.json", "utf-8", async (err, data) => {
                if (err) return reject(err);
                const messages = JSON.parse(data);
                // loop through all react objects, fetch the message, then resetup the reaction collector.
                if (messages.ids.length > 0) {
                    for (const m of messages.ids) {
                        const guild = await client.guilds.fetch(m.guildId);
                        const channel = guild.channels.cache.find(v => v.id === m.channelId);
                        if (!(channel instanceof Discord.TextChannel)) continue;
                        channel.messages.fetch(m.messageId).then(async message => {
                            const role = await guild.roles.fetch(m.roleId);
                            if (!(registermessage.collections.get(`${message.id}:${channel.id}:${message.guild.id}`)))
                                registermessage.collectReactions(message, role, client, m.emojiAddId, m.emojiRemoveId);
                        }).catch(() => {
                            unregistermessage.deleteReactionMessage(m.messageId, channel.id, () => {
                                const regId = `${m.messageId}:${channel.id}:${m.guildId}`;
                                if (registermessage.collections.get(regId)) {
                                    registermessage.collections.get(regId).stop();
                                    registermessage.collections.delete(regId);
                                }
                            });
                        });
                    }
                } else if (registermessage.collections.size > 0) {
                    registermessage.collections.forEach((collection, key) => {
                        collection.stop();
                        registermessage.collections.delete(key);
                    });
                }
                resolve();
            });
        });
    },
};

const Discord = require('discord.js');
const settings = require('./settings.json');
const pkg = require('./package.json');
const commands = require('./commands');
const fs = require('fs');
const registermessage = require('./commands/registermessage');
const unregistermessage = require('./commands/unregistermessage');

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

function main() {
    scan('./commands', client.commands);
    client.once('ready', () => {
        console.log(`${pkg.name}@${pkg.version} has started.`);
        client.generateInvite(8).then(link => {
            console.log(link);
        });
        commands.register(client);
    });

    // everytime bot is ready, reload all the react messages.
    client.on('ready', async () => {
        await module.exports.refreshAllActiveMessages();
    });

    client.login(settings.token);
}

main();