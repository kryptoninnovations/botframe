/**
 * Event Handler, loads and binds event listeners from the events directory
 * Each subfolder is a Discord.js event name. Handler files inside run in alphabetical order
 * 
 * @example
 * // eventsPath/messageCreate/log.js
 * module.exports = async (client, message) => { ... };
 */


const path = require('path');
const getAllFiles = require('../utils/getAllFiles');

module.exports.loadEvents = async (client, eventsBasePath) => {
  const eventFolders = getAllFiles(eventsBasePath, true);

  for (const eventFolder of eventFolders) {
    const eventFiles = getAllFiles(eventFolder);
    eventFiles.sort();

    const eventName = path.basename(eventFolder);
    const handlers = eventFiles.map(require);

    client.on(eventName, async (...args) => {
      for (const handler of handlers) {
        try {
          await handler(client, ...args);
        } catch (error) {
          console.error(`Error in event handler "${eventName}":`, error);
        }
      }
    });
  }
};