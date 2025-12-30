const fs = require('fs');
const path = require('path');
const EmbedComponentsV2 = require('../../utils/embedComponentsV2');

module.exports = {
  customId: 'select-buttons',
  async execute(interaction, client) {
    if (!interaction.isStringSelectMenu()) return;

    try {
      await interaction.deferUpdate();
      const selectedButtons = interaction.values;

      const buttonsPath = path.join(__dirname, '../../buttons');

      let reloadedButtons = 0;
      let failedButtons = 0;

      for (const buttonName of selectedButtons) {
        const buttonFile = `${buttonName}.js`;
        const buttonPath = path.join(buttonsPath, buttonFile);

        try {
          delete require.cache[require.resolve(buttonPath)];
          require(buttonPath);

          reloadedButtons++;
          console.log(`Tải lại button: ${buttonName}`);
        } catch (error) {
          console.error(`Lỗi khi tải lại button ${buttonName}:`, error);
          failedButtons++;
        }
      }

      const container = EmbedComponentsV2.createContainer();
      
      if (failedButtons > 0) {
        container.addTextDisplay(`## ⚠️ Tải lại một phần thành công`);
      } else {
        container.addTextDisplay(`## ✅ Tải lại thành công!`);
      }
      
      container.addSeparator({ divider: true });
      container.addTextDisplay(`Đã tải lại **${reloadedButtons}** buttons${failedButtons > 0 ? `, **${failedButtons}** buttons lỗi` : ''}`);
      container.addTextDisplay(`-# <t:${Math.floor(Date.now() / 1000)}:f>`);

      await interaction.message.channel.send(container.build());
      await interaction.message.edit({ components: [] });
    } catch (error) {
      console.error('Lỗi trong buttonsSelectHandler:', error);
      await interaction.message.channel.send('❌ Có lỗi xảy ra khi tải lại buttons!');
    }
  },
};
