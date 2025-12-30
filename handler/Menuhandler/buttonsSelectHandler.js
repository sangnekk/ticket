const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  customId: 'select-buttons',
  async execute(interaction, client) {
    if (!interaction.isStringSelectMenu()) return;

    try {
      await interaction.deferUpdate();
      const selectedButtons = interaction.values;

      // Đường dẫn tới thư mục buttons
      const buttonsPath = path.join(__dirname, '../../buttons');

      // Tải lại các buttons đã chọn
      let reloadedButtons = 0;
      let failedButtons = 0;

      for (const buttonName of selectedButtons) {
        const buttonFile = `${buttonName}.js`;
        const buttonPath = path.join(buttonsPath, buttonFile);

        try {
          // Xóa cache của button
          delete require.cache[require.resolve(buttonPath)];

          // Tải lại button
          require(buttonPath);

          reloadedButtons++;
          console.log(`Tải lại button: ${buttonName}`);
        } catch (error) {
          console.error(`Lỗi khi tải lại button ${buttonName}:`, error);
          failedButtons++;
        }
      }

      // Gửi thông báo kết quả
      const embed = new EmbedBuilder()
        .setColor(failedButtons > 0 ? '#FFA500' : '#00FF00')
        .setTitle(failedButtons > 0 ? '⚠️ Tải lại một phần thành công' : '✅ Tải lại thành công!')
        .setDescription(
          `Đã tải lại ${reloadedButtons} buttons${failedButtons > 0 ? `, ${failedButtons} buttons lỗi` : ''}`
        )
        .setTimestamp();

      await interaction.message.channel.send({ embeds: [embed] });

      // Cập nhật tin nhắn menu thành không có components
      await interaction.message.edit({
        components: [],
      });
    } catch (error) {
      console.error('Lỗi trong buttonsSelectHandler:', error);
      await interaction.message.channel.send('❌ Có lỗi xảy ra khi tải lại buttons!');
    }
  },
};
