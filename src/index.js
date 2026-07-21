/**
 * botframe, a lightweight Discord.js framework for single-server bots
 * @module botframe
 * 
 * @example
 * const { FrameworkClient } = require('botframe');
 * const client = new FrameworkClient({ commandsPath: __dirname + '/commands', eventsPath: __dirname + '/events' });
 * client.start(process.env.TOKEN);
 */

const { FrameworkClient } = require('./client');
module.exports = { FrameworkClient };