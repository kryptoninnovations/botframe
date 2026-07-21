/**
 * areCommandsDifferent, deep-compares two command properties
 * Checks description, option count, and each option's properties
 * @param {Object} existingCommand - From Discord's API
 * @param {Object} localCommand - From local files
 * @returns {boolean} true if they differ and need re-registration
 */

module.exports = (existingCommand, localCommand) => {
  const areChoicesDifferent = (existingChoices, localChoices) => {
    for (const localChoice of localChoices) {
      const existingChoice = existingChoices?.find(c => c.name === localChoice.name);
      if (!existingChoice) return true;
      if (localChoice.value !== existingChoice.value) return true;
    }
    return false;
  };

  const areOptionsDifferent = (existingOptions, localOptions) => {
    for (const localOption of localOptions) {
      const existingOption = existingOptions?.find(o => o.name === localOption.name);
      if (!existingOption) return true;
      if (
        localOption.description !== existingOption.description ||
        localOption.type !== existingOption.type ||
        (localOption.required || false) !== existingOption.required ||
        (localOption.choices?.length || 0) !== (existingOption.choices?.length || 0) ||
        areChoicesDifferent(localOption.choices || [], existingOption.choices || [])
      ) {
        return true;
      }
    }
    return false;
  };

  const existingOptions = existingCommand.options || [];
  const localOptions = localCommand.options || [];

  if (
    existingCommand.description !== localCommand.description ||
    existingOptions.length !== localOptions.length ||
    areOptionsDifferent(existingOptions, localOptions)
  ) {
    return true;
  }

  return false;
};