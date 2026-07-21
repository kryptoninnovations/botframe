/**
 * FrameworkClient, core bot client extending discord.js Client
 * Handles command registration, event loading, and permission checks
 * @extends {Client}
 */

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

    const banner = `
     _           _    __                          
    | |         | |  / _|                         
    | |__   ___ | |_| |_ _ __ __ _ _ __ ___   ___ 
    | '_ \\ / _ \\| __|  _| '__/ _\` | '_ \` _ \\ / _ \\
    | |_) | (_) | |_| | | | | (_| | | | | | |  __/
    |_.__/ \\___/ \\__|_| |_|  \\__,_|_| |_| |_|\\___|
    
    v${require("../package.json").version}
    https://kryptoninnovations.co.uk
    `;
    console.log(banner);

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
    console.log(`${this.user.username} is online (took ${timeTaken}ms)`);
  }
}

module.exports = { FrameworkClient };
