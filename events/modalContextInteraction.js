const { Events, InteractionType } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    // Xử lý Modal Submits
    if (interaction.type === InteractionType.ModalSubmit) {
      let modal = client.modals.get(interaction.customId);

      // Nếu không tìm thấy chính xác customId, thử tìm theo pattern
      if (!modal) {
        // Kiểm tra các pattern như "buy_request_${selectedValue}"
        for (const [id, handler] of client.modals.entries()) {
          // Bỏ qua nếu id không phải string hoặc RegExp
          if (typeof id !== 'string' && !(id instanceof RegExp)) continue;

          // Nếu id là RegExp, kiểm tra có match với customId không
          if (id instanceof RegExp && id.test(interaction.customId)) {
            modal = handler;
            break;
          }

          // Kiểm tra pattern dạng prefix_*
          if (typeof id === 'string' && id.endsWith('_*')) {
            const prefix = id.slice(0, -2); // Bỏ "_*" ở cuối
            if (interaction.customId.startsWith(prefix)) {
              modal = handler;
              break;
            }
          }
        }
      }

      if (!modal) return;

      try {
        // Truyền thêm thông tin về selectedValue nếu có
        const customIdParts = interaction.customId.split('_');
        const selectedValue =
          customIdParts.length > 2 ? customIdParts[customIdParts.length - 1] : null;

        await modal.execute(interaction, client, { selectedValue });
      } catch (error) {
        console.error(`Lỗi khi xử lý modal ${interaction.customId}:`, error);
        await interaction
          .reply({
            content: 'Đã xảy ra lỗi khi xử lý form này!',
            ephemeral: true,
          })
          .catch(err => {});
      }
      return;
    }

    // Xử lý Context Menu
    if (interaction.isContextMenuCommand()) {
      // Đối với Context Menu, sử dụng cả commandName và customId để tìm
      let contextCommand =
        client.contextCommands.get(interaction.customId) ||
        client.contextCommands.get(interaction.commandName);

      // Nếu không tìm thấy trực tiếp, thử tìm theo pattern
      if (!contextCommand) {
        for (const [id, handler] of client.contextCommands.entries()) {
          // Bỏ qua nếu id không phải string hoặc RegExp
          if (typeof id !== 'string' && !(id instanceof RegExp)) continue;

          // Nếu id là RegExp, kiểm tra có match với commandName hoặc customId
          if (
            id instanceof RegExp &&
            (id.test(interaction.customId) || id.test(interaction.commandName))
          ) {
            contextCommand = handler;
            break;
          }

          // Kiểm tra pattern dạng prefix_*
          if (typeof id === 'string' && id.endsWith('_*')) {
            const prefix = id.slice(0, -2); // Bỏ "_*" ở cuối
            if (
              interaction.customId?.startsWith(prefix) ||
              interaction.commandName?.startsWith(prefix)
            ) {
              contextCommand = handler;
              break;
            }
          }
        }
      }

      if (!contextCommand) return;

      try {
        // Truyền thêm thông tin về selectedValue nếu có
        const customId = interaction.customId || interaction.commandName;
        const customIdParts = customId.split('_');
        const selectedValue =
          customIdParts.length > 2 ? customIdParts[customIdParts.length - 1] : null;

        await contextCommand.execute(interaction, client, { selectedValue });
      } catch (error) {
        console.error(
          `Lỗi khi xử lý context command ${interaction.customId || interaction.commandName}:`,
          error
        );
        await interaction
          .reply({
            content: 'Đã xảy ra lỗi khi thực hiện lệnh này!',
            ephemeral: true,
          })
          .catch(err => {});
      }
    }
  },
};
