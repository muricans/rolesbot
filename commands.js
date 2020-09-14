const {
    prefix,
} = require('./settings.json');

module.exports.register = (client) => {
    client.on('message', message => {
        if (message.content.indexOf(prefix) !== 0) return;
        const args = message.content.slice(prefix.length).split(' ');
        const command = client.commands.get(args.shift().toLowerCase());
        if (!command || !command.execute) return;
        executeCommand(command, message, args, client);
    });
};

function executeCommand(command, message, args, client) {
    if (command.args && args.length < command.minArgs) return message.channel.send(`${message.author} Please add parms! r!${command.name} ${command.usage}`);
    if (command.permission) {
        let count = 0;
        for (const perm in command.permissions) {
            const hasPerm = message.channel.permissionsFor(message.member).has(perm);
            if (hasPerm) count++;
            else return message.channel.send(`${message.author} You don't have permission to use this command!`);
        }
        if (count === command.permissions.length) command.execute(message, args, client);
    } else command.execute(message, args, client);
}