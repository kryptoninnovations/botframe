const path = require('path');
const getAllFiles = require('../utils/getAllFiles');

module.exports.loadEvents = async (client, eventsBasePath) => {
  const eventFolders = getAllFiles(eventsBasePath, true);

  for (const eventFolder of eventFolders) {
    const eventFiles = getAllFiles(eventFolder);
    eventFiles.sort((a, b) => a > b);

    const eventName = path.basename(eventFolder);

    client.on(eventName, async (...args) => {
      for (const eventFile of eventFiles) {
        const eventFunction = require(eventFile);
        await eventFunction(client, ...args);
      }
    });
  }
};