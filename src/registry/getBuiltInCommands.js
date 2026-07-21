/**
 * getBuiltInCommands, returns framework built-in commands
 * Can be overridden by a local command with the same name
 * @returns {Object[]}
 */

const path = require('path');
const { EmbedBuilder } = require('discord.js');

const frameworkVersion = require(path.join(__dirname, '..', '..', 'package.json')).version;

module.exports = () => [
  {
    name: 'status',
    description: 'Show bot and framework status.',
    restrictDMs: false,

    callback: async (client, interaction) => {
      await interaction.deferReply();
      const reply = await interaction.fetchReply();

      let botVersion = 'unknown';
      try { 
        botVersion = require(path.join(process.cwd(), 'package.json')).version; 
      } catch (_) { }

      const embed = new EmbedBuilder()
        .setTitle(`${client.user.username} Status`)
        .setColor('#24864a')
        .addFields(
          { name: 'botframe Version', value: `v${frameworkVersion}`, inline: true },
          { name: 'Bot Version', value: `v${botVersion}`, inline: true },
          { name: 'Uptime', value: `${Math.floor(process.uptime())}s`, inline: true },
          { name: 'Client Ping', value: `${reply.createdTimestamp - interaction.createdTimestamp}ms`, inline: true },
          { name: 'WebSocket Ping', value: `${client.ws.ping}ms`, inline: true },
          { name: 'Memory Usage', value: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`, inline: true }
        );

      await interaction.editReply({ embeds: [embed] });
    },
  },
];