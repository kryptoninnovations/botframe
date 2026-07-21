/**
 * Command Handler, checks before running a command's callback
 */

const { MessageFlags } = require('discord.js');

module.exports.handleCommand = async (client, interaction, commands) => {
  const commandObject = commands.get(interaction.commandName);
  if (!commandObject) return;

  if (commandObject.devOnly && !client.config.devUserIds.includes(interaction.user.id)) {
    return interaction.reply({
      content: '❌ You do not have the valid permissions required for this command. This command is restricted to Developers only.',
      flags: MessageFlags.Ephemeral,
    });
  }

  const isDM = !interaction.guild;

  if (isDM && commandObject.restrictDMs !== false) {
    return interaction.reply({
      content: '❌ You cannot use this command in Direct Messages.',
      flags: MessageFlags.Ephemeral,
    });
  }

  if (!isDM) {
    if (commandObject.permissionsRequired?.length) {
      const hasRole = interaction.member.roles.cache.some(role =>
        commandObject.permissionsRequired.includes(role.id)
      );

      if (!hasRole) {
        return interaction.reply({
          content: `❌ You do not have the valid permissions required for this command. This command is restricted to: ${commandObject.permissionsRequired.map(id => `<@&${id}>`).join(', ')} only.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }

  try {
    await commandObject.callback(client, interaction);
  } catch (error) {
    console.error(`Command "${commandObject.name}" error:`, error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ An error occurred, please contact the bot developer if this continues.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
};