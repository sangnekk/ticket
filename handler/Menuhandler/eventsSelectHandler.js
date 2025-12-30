const fs = require('fs');
const path = require('path');
const EmbedComponentsV2 = require('../../utils/embedComponentsV2');

module.exports = {
  customId: 'select-events',
  async execute(interaction, client) {
    if (!interaction.isStringSelectMenu()) return;

    try {
      await interaction.deferUpdate();
      const selectedEvents = interaction.values;

      const eventsPath = path.join(__dirname, '../../events');

      let reloadedEvents = 0;
      let failedEvents = 0;

      for (const eventName of selectedEvents) {
        const eventFile = `${eventName}.js`;
        const eventPath = path.join(eventsPath, eventFile);

        try {
          delete require.cache[require.resolve(eventPath)];
          const event = require(eventPath);
          client.removeAllListeners(eventName);

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

      const container = EmbedComponentsV2.createContainer();
      
      if (failedEvents > 0) {
        container.addTextDisplay(`## ⚠️ Tải lại một phần thành công`);
      } else {
        container.addTextDisplay(`## ✅ Tải lại thành công!`);
      }
      
      container.addSeparator({ divider: true });
      container.addTextDisplay(`Đã tải lại **${reloadedEvents}** events${failedEvents > 0 ? `, **${failedEvents}** events lỗi` : ''}`);
      container.addTextDisplay(`-# <t:${Math.floor(Date.now() / 1000)}:f>`);

      await interaction.message.channel.send(container.build());
      await interaction.message.edit({ components: [] });
    } catch (error) {
      console.error('Lỗi trong eventsSelectHandler:', error);
      await interaction.message.channel.send('❌ Có lỗi xảy ra khi tải lại events!');
    }
  },
};
