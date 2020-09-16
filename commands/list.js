const rolebot = require('../rolebot');
const fs = require('fs');
const {
    EmbedBuilder,
} = require('discord-embedbuilder');

module.exports = {
    name: 'list',
    description: 'Refreshes and lists all currently active role react messages.',
    permissions: ['MANAGE_GUILD'],
    async execute(message) {
        rolebot.refreshActiveMessagesFor(message.guild.id);
        const messages = JSON.parse(fs.readFileSync('./messages.json', 'utf-8'));
        const list = messages.ids.filter(v => v.guildId === message.guild.id);
        if (list.length > 0) {
            const builder = new EmbedBuilder(message.channel);
            const guild = await message.guild.fetch();
            builder.calculatePages(list.length, 8, async (embed, i) => {
                    const channelName = guild.channels.cache.get(list[i].channelId);
                    const roleName = guild.roles.cache.get(list[i].roleId);
                    embed.addField("Message ID", list[i].messageId, true);
                    embed.addField("Channel", `${channelName}`, true);
                    embed.addField("Role", `${roleName}`, true);
                })
                .setTitle("List of All Active Messages")
                .build();
        } else {
            message.channel.send(`${message.author} No messages are currently registered in this guild!`);
        }
    },
};