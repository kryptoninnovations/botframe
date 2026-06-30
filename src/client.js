const { Client, GatewayIntentBits, Partials } = require('discord.js');
const registerCommands = require('./registry/registerCommands');
const getLocalCommands = require('./registry/getLocalCommands');
const getBuiltInCommands = require('./registry/getBuiltInCommands');
const { loadEvents } = require('./handlers/eventHandler');
const { handleCommand } = require('./handlers/commandHandler');

const defaultIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.DirectMessages,
];

const defaultPartials = [
  Partials.Message,
  Partials.Channel,
  Partials.Reaction,
];

class FrameworkClient extends Client {
  constructor(options = {}) {
    const {
      intents = defaultIntents,
      partials = defaultPartials,
      commandsPath,
      eventsPath,
      devUserIds = [],
      ...clientOptions
    } = options;

    // MUST call super() before accessing this
    super({ intents, partials, ...clientOptions });

    this.config = {
      commandsPath,
      eventsPath,
      devUserIds,
    };

    this.commands = new Map();
  }

  async start(token) {
    const time = Date.now();

    const purple = "\x1b[35m";
    const reset = "\x1b[0m";

    const botframeLogo = `
    _         _    __                    

    | |__  ___| |_ / _|_ _ __ _ _ __  ___ 
    | '_ \\/ _ \\  _|  _| '_/ _\` | '  \\/ -_)
    |_.__/\\___/\\__|_| |_| \\__,_|_|_|_\\___|
    `;

    console.log(`krypton Innovations`);
    console.log(`${purple}${botframeLogo}${reset}`);
    console.log(`v${require("../package.json").version} | ${time}\n`);


    const builtInCommands = getBuiltInCommands();

    const localCommands = getLocalCommands(this.config.commandsPath);

    const allCommands = [...builtInCommands];
    for (const cmd of localCommands) {
      const existingIndex = allCommands.findIndex(c => c.name === cmd.name);
      if (existingIndex !== -1) {
        allCommands[existingIndex] = cmd;
      } else {
        allCommands.push(cmd);
      }
    }

    this.commands.clear();
    for (const cmd of allCommands) {
      this.commands.set(cmd.name, cmd);
    }

    if (this.config.eventsPath) {
      await loadEvents(this, this.config.eventsPath);
    }

    this.on('interactionCreate', async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await handleCommand(this, interaction, this.commands);
      }
    });

    await this.login(token);

    await new Promise((resolve) => {
      if (this.isReady()) return resolve();
      this.once('clientReady', resolve);   // fixed deprecation
    });

    await registerCommands(this, allCommands);

    const timeTaken = Date.now() - time;
    console.log(`START | ${this.user.username} is online (took ${timeTaken}ms)`);
  }
}

module.exports = { FrameworkClient };