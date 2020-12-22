# rolesbot
Simple bot that can manage roles through reactions on messages in Discord.
|Command	         |Function                                                                            |
|--------------------|------------------------------------------------------------------------------------|
|help                |Lists all available commands.                                                       |
|list                |Lists all running reaction role messages.                                           |
|ping                |Pings the bot, and responds if running.                                             |
|purge               |Purges all running reaction role messages.                                          |
|registermessage     |Registers a message to listen for reactions to add the given role.                  |
|registermultimessage|Takes a JSON file uploaded and takes all emojis and turns them into reaction roles. |
|unregistermessage   |Unregisters a message, and deletes the listener for it.                             |