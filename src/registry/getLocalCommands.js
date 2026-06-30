const path = require('path');
const getAllFiles = require('../utils/getAllFiles');

module.exports = (commandsBasePath, exceptions = []) => {
  let localCommands = [];

  const commandCategories = getAllFiles(commandsBasePath, true);

  for (const commandCategory of commandCategories) {
    const commandFiles = getAllFiles(commandCategory);

    for (const commandFile of commandFiles) {
      const commandObject = require(commandFile);

      if (exceptions.includes(commandObject.name)) {
        continue;
      }

      localCommands.push(commandObject);
    }
  }

  return localCommands;
};