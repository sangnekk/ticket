const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    let button = client.buttons.get(interaction.customId);

    if (!button) {
      for (const [id, handler] of client.buttons.entries()) {
        if (typeof id !== 'string' && !(id instanceof RegExp)) continue;

        if (id instanceof RegExp && id.test(interaction.customId)) {
          button = handler;
          break;
        }

        if (typeof id === 'string' && id.endsWith('_*')) {
          const prefix = id.slice(0, -2);
          if (interaction.customId.startsWith(prefix)) {
            button = handler;
            break;
          }
        }
      }
    }

    if (!button) return;

    try {
      const customIdParts = interaction.customId.split('_');
      const selectedValue =
        customIdParts.length > 2 ? customIdParts[customIdParts.length - 1] : null;

      const result = await button.execute(interaction, client, { selectedValue });
      if (result) {
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply(result);
        } else {
          await interaction.reply(result);
        }
      }
    } catch (error) {
      console.error(`Lỗi khi xử lý button ${interaction.customId}:`, error);
      const errorMessage = {
        content: 'Đã xảy ra lỗi khi xử lý nút này.',
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  },
};
