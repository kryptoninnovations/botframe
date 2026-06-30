const { MessageFlags } = require('discord.js');

module.exports.handleCommand = async (client, interaction, commands) => {
  const commandObject = commands.get(interaction.commandName);
  if (!commandObject) return;

  // Must be in a guild
  if (!interaction.guild) {
    return interaction.reply({
      content: '❌ You cannot use commands in Direct Messages.',
      flags: MessageFlags.Ephemeral,
    });
  }

  // Dev only check
  if (commandObject.devOnly) {
    if (!client.config.devUserIds.includes(interaction.user.id)) {
      return interaction.reply({
        content: '❌ This command is restricted to Developers only.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  // Role-based permissions
  if (commandObject.permissionsRequired?.length) {
    const hasRole = interaction.member.roles.cache.some(role =>
      commandObject.permissionsRequired.includes(role.id)
    );

    if (!hasRole) {
      return interaction.reply({
        content: '❌ You do not have the valid permissions required for this command.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  try {
    await commandObject.callback(client, interaction);
  } catch (error) {
    console.error(`Command "${commandObject.name}" error:`, error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ An error occurred.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
};