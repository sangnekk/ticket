const fs = require('fs');
const path = require('path');
const EmbedComponentsV2 = require('../../utils/embedComponentsV2');

module.exports = {
  customId: 'select-utils',
  async execute(interaction, client) {
    if (!interaction.isStringSelectMenu()) return;

    try {
      await interaction.deferUpdate();
      const selectedUtils = interaction.values;

      const utilsPath = path.join(__dirname, '../../utils');

      let reloadedUtils = 0;
      let failedUtils = 0;

      for (const utilName of selectedUtils) {
        const utilFile = `${utilName}.js`;
        const utilPath = path.join(utilsPath, utilFile);

        try {
          delete require.cache[require.resolve(utilPath)];
          require(utilPath);

          reloadedUtils++;
          console.log(`Tải lại util: ${utilName}`);
        } catch (error) {
          console.error(`Lỗi khi tải lại util ${utilName}:`, error);
          failedUtils++;
        }
      }

      const container = EmbedComponentsV2.createContainer();
      
      if (failedUtils > 0) {
        container.addTextDisplay(`## ⚠️ Tải lại một phần thành công`);
      } else {
        container.addTextDisplay(`## ✅ Tải lại thành công!`);
      }
      
      container.addSeparator({ divider: true });
      container.addTextDisplay(`Đã tải lại **${reloadedUtils}** utils${failedUtils > 0 ? `, **${failedUtils}** utils lỗi` : ''}`);
      container.addTextDisplay(`-# <t:${Math.floor(Date.now() / 1000)}:f>`);

      await interaction.message.channel.send(container.build());
      await interaction.message.edit({ components: [] });
    } catch (error) {
      console.error('Lỗi trong utilsSelectHandler:', error);
      await interaction.message.channel.send('❌ Có lỗi xảy ra khi tải lại utils!');
    }
  },
};
