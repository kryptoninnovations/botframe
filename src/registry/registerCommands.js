const areCommandsDifferent = require('../utils/areCommandsDifferent');

module.exports = async (client, localCommands) => {
  const applicationCommands = client.application.commands;
  await applicationCommands.fetch();

  for (const localCommand of localCommands) {
    const { name, description, options } = localCommand;

    try {
      const existingCommand = applicationCommands.cache.find(
        (cmd) => cmd.name === name
      );

      if (existingCommand) {
        if (localCommand.deleted) {
          await applicationCommands.delete(existingCommand.id);
          console.log(`REGISTER | Deleted command "${name}".`);
          continue;
        }

        if (areCommandsDifferent(existingCommand, localCommand)) {
          await applicationCommands.edit(existingCommand.id, {
            description,
            options: options || [],   // explicit empty array to clear old options
          });
          console.log(`REGISTER | Edited command "${name}".`);
        }
      } else {
        if (localCommand.deleted) {
          console.log(`REGISTER | Skipped "${name}" since it's marked deleted.`);
          continue;
        }

        await applicationCommands.create({
          name,
          description,
          options: options || [],
        });
        console.log(`REGISTER | Registered command "${name}".`);
      }
    } catch (err) {
      console.log(`REGISTER | Error while handling "${name}": ${err}`);
    }
  }
};