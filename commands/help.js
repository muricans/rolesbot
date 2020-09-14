const {
    EmbedBuilder,
} = require('discord-embedbuilder');
const {
    prefix,
} = require('../settings.json');

module.exports = {
    name: 'help',
    description: 'Gets all the commands registered to the bot.',
    execute(message, args, client) {
        const builder = new EmbedBuilder(message.channel);
        const commands = client.commands.array().sort((a, b) => a.name > b.name ? 1 : -1);
        builder
            .calculatePages(commands.length, 8, (embed, i) => {
                const usage = commands[i].usage ? commands[i].usage : "";
                embed.addField(`${prefix}${commands[i].name} ${usage}`, commands[i].description);
            })
            .setTitle('rolebot commmands')
            .build();
    },
};