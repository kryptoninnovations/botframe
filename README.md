<img width="800" height="100" alt="botframe - by krypton" src="https://github.com/user-attachments/assets/ed8dd94d-ba4a-48d0-a84e-b4423d55f633" />
<hr>

A lightweight Discord.js framework for private bots (bots that'd be used only by one server). <br>
No need to hand-write slash command registration or event routing, so you can focus on the core design of your bot. <br>
It just works, and it's what we use across our own internal bots.

## Install
```bash
npm install github:kryptoninnovations/botframe#main
````

Requires `discord.js` ^14.26.4 in your project.

## Quick start
```js
const path = require('node:path');
const { FrameworkClient } = require('botframe');

const client = new FrameworkClient({
  commandsPath: path.join(__dirname, 'commands'),
  eventsPath: path.join(__dirname, 'events'),
  devUserIds: ['YOUR_DISCORD_USER_ID'],
  builtInCommands: {
    status: true,
    botframe: true,
  },
});

client.start(process.env.TOKEN);
```

## Configuration
### Client options
Pass these options to `new FrameworkClient({ ... })`:

* `commandsPath` - directory containing command category folders, such as `commands/admin`.
* `eventsPath` - directory containing event folders, such as `events/messageCreate`.
* `devUserIds` - Discord user IDs allowed to run commands with `devOnly: true`.
* `builtInCommands` - enables or disables framework commands by name. Both built-in commands are enabled by default. Local commands cannot use the same names as enabled built-in commands.
* `intents` - Discord gateway intents. Defaults to Guilds, GuildMembers, GuildMessages, MessageContent, and DirectMessages.
* `partials` - Discord partials. Defaults to Message, Channel, and Reaction.
* Any other option - passed to the Discord.js `Client` constructor.

Example:

```js
const path = require('node:path');
const { FrameworkClient } = require('botframe');

const client = new FrameworkClient({
  commandsPath: path.join(__dirname, 'commands'),
  eventsPath: path.join(__dirname, 'events'),
  devUserIds: ['123456789012345678'],
  builtInCommands: {
    status: true,
    botframe: false,
  },
});
```

Call `client.start(process.env.TOKEN)` after creating the client.

## Commands
Put one file per command in `commandsPath/<category>/<commandFile>.js`.

```js
// commandsPath/tools/ping.js
module.exports = {
  name: 'ping',
  description: 'Replies with pong',
  options: [], // optional, standard discord.js slash command options
  permissionsRequired: [], // optional, array of role IDs allowed to use this command
  cooldown: 5000, // optional, milliseconds between uses per user
  devOnly: false, // optional, restrict to devUserIds defined
  restrictDMs: true, // optional, set false to allow use in direct messages
  callback: async (client, interaction) => {
    await interaction.reply('pong');
  },
};
```

Everything gets registered automatically when `client.start()` runs. New commands are created, existing ones are only edited if their description or options actually changed, and commands removed from the project are also removed from Discord.

botframe includes `/status`, which shows framework and bot details, and `/botframe`, which provides information about the framework.

Built-in commands can be disabled through `builtInCommands` if you want to define your own command with the same name.

### Command runtime
Before a command's `callback` runs, botframe checks:

1. It is not being used in DMs by default; set `restrictDMs: false` to allow direct messages,
2. If `devOnly` is set, the user is in `devUserIds`,
3. If `permissionsRequired` is set, the user has at least one of those role IDs.

If `callback` throws, the error gets logged and the user just sees a generic "something went wrong" reply.

## Events
Put handler files in `eventsPath/<eventName>/<handlerFile>.js`, one folder per Discord.js event name. You can have as many handler files in a folder as you want.

```js
// eventsPath/messageCreate/logMessages.js
module.exports = async (client, message) => {
  console.log(`${message.author.tag}: ${message.content}`);
};
```

Handlers within a folder run in alphabetical file order, one after another.

## Attributions
Created by krypton Innovations <br>
Originally based on [notunderctrl](https://github.com/notunderctrl)'s Discord.js v14 tutorial