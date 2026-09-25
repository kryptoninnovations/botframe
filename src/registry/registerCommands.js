/**
 * registerCommands, syncs local commands with Discord's API
 * Creates new, edits changed, and removes commands no longer in the project
 */

const areCommandsDifferent = require('../utils/areCommandsDifferent');

module.exports = async (client, localCommands) => {
  const applicationCommands = client.application.commands;
  await applicationCommands.fetch();
  const localCommandNames = new Set(localCommands.map(command => command.name));

  for (const localCommand of localCommands) {
    const { name, description, options } = localCommand;

    try {
      const existingCommand = typeof applicationCommands.cache.find === 'function'
        ? applicationCommands.cache.find(cmd => cmd.name === name)
        : Array.from(applicationCommands.cache.values()).find(cmd => cmd.name === name);

      if (existingCommand) {
        if (areCommandsDifferent(existingCommand, localCommand)) {
          await applicationCommands.edit(existingCommand.id, {
            description,
            options: options || [],   // explicit empty array to clear old options
          });
          console.log(`Edited command "${name}"`);
        }
      } else {
        await applicationCommands.create({
          name,
          description,
          options: options || [],
        });
        console.log(`Registered command "${name}"`);
      }
    } catch (err) {
      console.error(`Error while handling "${name}":`, err);
    }
  }

  for (const existingCommand of applicationCommands.cache.values()) {
    if (localCommandNames.has(existingCommand.name)) continue;

    try {
      await applicationCommands.delete(existingCommand.id);
      console.log(`Deleted command "${existingCommand.name}" because it is no longer present`);
    } catch (err) {
      console.error(`Error while deleting "${existingCommand.name}":`, err);
    }
  }
};