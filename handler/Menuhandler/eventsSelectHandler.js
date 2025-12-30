const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  customId: 'select-events',
  async execute(interaction, client) {
    if (!interaction.isStringSelectMenu()) return;

    try {
      await interaction.deferUpdate();
      const selectedEvents = interaction.values;

      // Đường dẫn tới thư mục events
      const eventsPath = path.join(__dirname, '../../events');

      // Tải lại các events đã chọn
      let reloadedEvents = 0;
      let failedEvents = 0;

      for (const eventName of selectedEvents) {
        const eventFile = `${eventName}.js`;
        const eventPath = path.join(eventsPath, eventFile);

        try {
          // Xóa cache của event
          delete require.cache[require.resolve(eventPath)];

          // Tải lại event
          const event = require(eventPath);

          // Xóa sự kiện cũ
          client.removeAllListeners(eventName);

          // Đăng ký lại sự kiện
          if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
          } else {
            client.on(event.name, (...args) => event.execute(...args, client));
          }

          reloadedEvents++;
          console.log(`Tải lại event: ${eventName}`);
        } catch (error) {
          console.error(`Lỗi khi tải lại event ${eventName}:`, error);
          failedEvents++;
        }
      }

      // Gửi thông báo kết quả
      const embed = new EmbedBuilder()
        .setColor(failedEvents > 0 ? '#FFA500' : '#00FF00')
        .setTitle(failedEvents > 0 ? '⚠️ Tải lại một phần thành công' : '✅ Tải lại thành công!')
        .setDescription(
          `Đã tải lại ${reloadedEvents} events${failedEvents > 0 ? `, ${failedEvents} events lỗi` : ''}`
        )
        .setTimestamp();

      await interaction.message.channel.send({ embeds: [embed] });

      // Cập nhật tin nhắn menu thành không có components
      await interaction.message.edit({
        components: [],
      });
    } catch (error) {
      console.error('Lỗi trong eventsSelectHandler:', error);
      await interaction.message.channel.send('❌ Có lỗi xảy ra khi tải lại events!');
    }
  },
};
