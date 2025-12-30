const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  customId: 'select-utils',
  async execute(interaction, client) {
    if (!interaction.isStringSelectMenu()) return;

    try {
      await interaction.deferUpdate();
      const selectedUtils = interaction.values;

      // Đường dẫn tới thư mục utils
      const utilsPath = path.join(__dirname, '../../utils');

      // Tải lại các utils đã chọn
      let reloadedUtils = 0;
      let failedUtils = 0;

      for (const utilName of selectedUtils) {
        const utilFile = `${utilName}.js`;
        const utilPath = path.join(utilsPath, utilFile);

        try {
          // Xóa cache của util
          delete require.cache[require.resolve(utilPath)];

          // Tải lại util
          require(utilPath);

          reloadedUtils++;
          console.log(`Tải lại util: ${utilName}`);
        } catch (error) {
          console.error(`Lỗi khi tải lại util ${utilName}:`, error);
          failedUtils++;
        }
      }

      // Gửi thông báo kết quả
      const embed = new EmbedBuilder()
        .setColor(failedUtils > 0 ? '#FFA500' : '#00FF00')
        .setTitle(failedUtils > 0 ? '⚠️ Tải lại một phần thành công' : '✅ Tải lại thành công!')
        .setDescription(
          `Đã tải lại ${reloadedUtils} utils${failedUtils > 0 ? `, ${failedUtils} utils lỗi` : ''}`
        )
        .setTimestamp();

      await interaction.message.channel.send({ embeds: [embed] });

      // Cập nhật tin nhắn menu thành không có components
      await interaction.message.edit({
        components: [],
      });
    } catch (error) {
      console.error('Lỗi trong utilsSelectHandler:', error);
      await interaction.message.channel.send('❌ Có lỗi xảy ra khi tải lại utils!');
    }
  },
};
