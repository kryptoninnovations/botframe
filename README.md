<img width="800" height="100" alt="botframe - by krypton" src="https://github.com/user-attachments/assets/59ebe32c-a38f-4924-a642-332379b70fab" />
<hr>

A lightweight Discord.js framework for slash command registration, permission checks, and event routing. It just works, and it's what we use across our own bots.

> Note: botframe uses a build number version system, not regular semantic versioning.

## Install
```bash
npm install github:kryptoninnovations/botframe#main
```
Requires `discord.js` ^14.26.4 in your project.

## Quick start
```js
const { FrameworkClient } = require('botframe');

const client = new FrameworkClient({
  commandsPath: __dirname + '/commands',
  eventsPath: __dirname + '/events',
  devUserIds: ['123456789012345678'],
});

client.start(process.env.TOKEN);
```
    
## Config options
These get passed into `new FrameworkClient({ ... })`:

- `commandsPath` - folder containing your command category subfolders
- `eventsPath` - folder containing your event name subfolders
- `devUserIds` - user IDs allowed to run `devOnly` commands
- `intents` - defaults to Guilds, GuildMembers, GuildMessages, MessageContent, DirectMessages
- `partials` - defaults to Message, Channel, Reaction
- anything else - passed straight through as normal discord.js `ClientOptions`

## Commands
Put one file per command in `commandsPath/<category>/<commandFile>.js`.

```js
module.exports = {
  name: 'ping',
  description: 'Replies with pong',
  options: [], // optional, standard discord.js slash command options
  devOnly: false, // optional, restrict to devUserIds
  permissionsRequired: [], // optional, array of role IDs allowed to use this command
  deleted: false, // optional, set true to remove this command from Discord

  callback: async (client, interaction) => {
    await interaction.reply('pong');
  },
};
```

Everything gets registered automatically when `client.start()` runs. New commands are created, existing ones are only edited if their description or options actually changed, and anything marked `deleted: true` gets removed from Discord (or just skipped if it was never registered).

### Built-in commands
botframe comes with one command by default, `/status`, which shows the framework version, your bot's version (pulled from your project's `package.json`), uptime, and client/WebSocket ping. If you define your own local command called `status`, yours will override the built-in one.

## Events
Put handler files in `eventsPath/<eventName>/<handlerFile>.js`, one folder per Discord.js event name. You can have as many handler files in a folder as you want.

```js
// eventsPath/messageCreate/logMessages.js
module.exports = async (client, message) => {
  console.log(`${message.author.tag}: ${message.content}`);
};
```

Handlers within a folder run in alphabetical file order, one after another.

## Permissions
Before a command's `callback` runs, botframe checks:
1. It's not being used in DMs (guild only).
2. If `devOnly` is set, the user is in `devUserIds`.
3. If `permissionsRequired` is set, the user has at least one of those role IDs.

If `callback` throws, the error gets logged and the user just sees a generic "something went wrong" reply.
