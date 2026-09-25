/**
 * getLocalCommands, scans category subfolders for command files
 * @param {string} commandsBasePath - Root commands directory
 * @returns {Object[]} Command objects ready for registration
 */

const getAllFiles = require('../utils/getAllFiles');

module.exports = commandsBasePath => {
  if (!commandsBasePath) return [];

  const localCommands = [];
  const commandCategories = getAllFiles(commandsBasePath, true);

  for (const commandCategory of commandCategories) {
    const commandFiles = getAllFiles(commandCategory);

    for (const commandFile of commandFiles) {
      localCommands.push(require(commandFile));
    }
  }

  return localCommands;
};