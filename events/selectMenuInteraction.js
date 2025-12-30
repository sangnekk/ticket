const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    if (!interaction.isStringSelectMenu()) return;

    let menu = client.selectMenus.get(interaction.customId);

    // Nếu không tìm thấy chính xác customId, thử tìm theo pattern
    if (!menu) {
      // Kiểm tra các pattern như "buy_request_${selectedValue}"
      for (const [id, handler] of client.selectMenus.entries()) {
        // Bỏ qua nếu id không phải string hoặc RegExp
        if (typeof id !== 'string' && !(id instanceof RegExp)) continue;

        // Nếu id là RegExp, kiểm tra có match với customId không
        if (id instanceof RegExp && id.test(interaction.customId)) {
          menu = handler;
          break;
        }

        // Kiểm tra pattern dạng prefix_*
        if (typeof id === 'string' && id.endsWith('_*')) {
          const prefix = id.slice(0, -2); // Bỏ "_*" ở cuối
          if (interaction.customId.startsWith(prefix)) {
            menu = handler;
            break;
          }
        }
      }
    }

    if (!menu) return;

    try {
      // Truyền thêm thông tin về selectedValue nếu có
      const customIdParts = interaction.customId.split('_');
      const selectedValue =
        customIdParts.length > 2 ? customIdParts[customIdParts.length - 1] : null;

      const result = await menu.execute(interaction, client, { selectedValue });
      if (result) {
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply(result);
        } else {
          await interaction.reply(result);
        }
      }
    } catch (error) {
      console.error(`Lỗi khi xử lý select menu ${interaction.customId}:`, error);
      const errorMessage = {
        content: 'Đã xảy ra lỗi khi xử lý lựa chọn này.',
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
