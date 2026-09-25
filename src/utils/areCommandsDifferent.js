/**
 * areCommandsDifferent, deep-compares two command properties
 * Checks description, options, and command definition properties
 * @param {Object} existingCommand - From Discord's API
 * @param {Object} localCommand - From local files
 * @returns {boolean} true if they differ and need re-registration
 */

module.exports = (existingCommand, localCommand) => {
  const normalizeChoice = choice => ({
    name: choice.name,
    value: choice.value,
  });

  const normalizeOption = option => {
    const normalized = {
      name: option.name,
      description: option.description,
      type: option.type,
      required: option.required || false,
      autocomplete: option.autocomplete || false,
      min_value: option.min_value,
      max_value: option.max_value,
      min_length: option.min_length,
      max_length: option.max_length,
      channel_types: option.channel_types,
      choices: option.choices?.map(normalizeChoice),
      options: option.options?.map(normalizeOption),
    };

    return Object.fromEntries(
      Object.entries(normalized).filter(([, value]) => value !== undefined)
    );
  };

  const normalizeCommand = command => ({
    name: command.name,
    description: command.description,
    type: command.type,
    default_member_permissions: command.default_member_permissions,
    dm_permission: command.dm_permission,
    nsfw: command.nsfw,
    contexts: command.contexts,
    integration_types: command.integration_types,
    options: command.options?.map(normalizeOption),
  });

  return JSON.stringify(normalizeCommand(existingCommand)) !==
    JSON.stringify(normalizeCommand(localCommand));
};