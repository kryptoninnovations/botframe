/**
 * getLocalCommands, scans category subfolders for command files
 * @param {string} commandsBasePath - Root commands directory
 * @param {string[]} [exceptions=[]] - Command names to skip (for overriding built-ins)
 * @returns {Object[]} Command objects ready for registration
 */


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