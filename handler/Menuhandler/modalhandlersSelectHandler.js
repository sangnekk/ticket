const fs = require('fs');
const path = require('path');
const EmbedComponentsV2 = require('../../utils/embedComponentsV2');

module.exports = {
  customId: 'select-modalhandlers',
  async execute(interaction, client) {
    if (!interaction.isStringSelectMenu()) return;

    try {
      await interaction.deferUpdate();
      const selectedHandlers = interaction.values;

      const handlersPath = path.join(__dirname, '../../handler/Modalhandler');

      let reloadedHandlers = 0;
      let failedHandlers = 0;

      for (const handlerName of selectedHandlers) {
        const handlerFile = `${handlerName}.js`;
        const handlerPath = path.join(handlersPath, handlerFile);

        try {
          delete require.cache[require.resolve(handlerPath)];
          require(handlerPath);

          reloadedHandlers++;
          console.log(`Tải lại modal handler: ${handlerName}`);
        } catch (error) {
          console.error(`Lỗi khi tải lại modal handler ${handlerName}:`, error);
          failedHandlers++;
        }
      }

      const container = EmbedComponentsV2.createContainer();
      
      if (failedHandlers > 0) {
        container.addTextDisplay(`## ⚠️ Tải lại một phần thành công`);
      } else {
        container.addTextDisplay(`## ✅ Tải lại thành công!`);
      }
      
      container.addSeparator({ divider: true });
      container.addTextDisplay(`Đã tải lại **${reloadedHandlers}** modal handlers${failedHandlers > 0 ? `, **${failedHandlers}** handlers lỗi` : ''}`);
      container.addTextDisplay(`-# <t:${Math.floor(Date.now() / 1000)}:f>`);

      await interaction.message.channel.send(container.build());
      await interaction.message.edit({ components: [] });
    } catch (error) {
      console.error('Lỗi trong modalhandlersSelectHandler:', error);
      await interaction.message.channel.send('❌ Có lỗi xảy ra khi tải lại modal handlers!');
    }
  },
};
