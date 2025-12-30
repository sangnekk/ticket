const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  customId: 'select-menuhandlers',
  async execute(interaction, client) {
    if (!interaction.isStringSelectMenu()) return;

    try {
      await interaction.deferUpdate();
      const selectedHandlers = interaction.values;

      // Đường dẫn tới thư mục handlers
      const handlersPath = path.join(__dirname, '../../handler/Menuhandler');

      // Tải lại các handlers đã chọn
      let reloadedHandlers = 0;
      let failedHandlers = 0;

      for (const handlerName of selectedHandlers) {
        const handlerFile = `${handlerName}.js`;
        const handlerPath = path.join(handlersPath, handlerFile);

        try {
          // Xóa cache của handler
          delete require.cache[require.resolve(handlerPath)];

          // Tải lại handler
          require(handlerPath);

          reloadedHandlers++;
          console.log(`Tải lại menu handler: ${handlerName}`);
        } catch (error) {
          console.error(`Lỗi khi tải lại menu handler ${handlerName}:`, error);
          failedHandlers++;
        }
      }

      // Gửi thông báo kết quả
      const embed = new EmbedBuilder()
        .setColor(failedHandlers > 0 ? '#FFA500' : '#00FF00')
        .setTitle(failedHandlers > 0 ? '⚠️ Tải lại một phần thành công' : '✅ Tải lại thành công!')
        .setDescription(
          `Đã tải lại ${reloadedHandlers} menu handlers${failedHandlers > 0 ? `, ${failedHandlers} handlers lỗi` : ''}`
        )
        .setTimestamp();

      await interaction.message.channel.send({ embeds: [embed] });

      // Cập nhật tin nhắn menu thành không có components
      await interaction.message.edit({
        components: [],
      });
    } catch (error) {
      console.error('Lỗi trong menuhandlersSelectHandler:', error);
      await interaction.message.channel.send('❌ Có lỗi xảy ra khi tải lại menu handlers!');
    }
  },
};
