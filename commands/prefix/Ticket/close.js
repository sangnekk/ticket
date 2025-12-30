const { ButtonStyle } = require('discord.js');
const { prisma, getGuildLanguage } = require('../../../utils/prisma');
const { GT } = require('../../../utils/guildI18n');
const EmbedComponentsV2 = require('../../../utils/embedComponentsV2');

module.exports = {
  name: 'close',
  description: 'Tạo embed với nút đóng ticket',
  usage: '+close',
  category: 'Ticket',

  async execute(message) {
    const { guild, channel } = message;

    // Lấy ngôn ngữ
    let locale = await getGuildLanguage(guild.id);
    if (!locale) locale = 'Vietnamese';

    try {
      // Xóa lệnh của user
      await message.delete().catch(() => {});

      // Kiểm tra có phải ticket không
      const ticket = await prisma.ticket.findUnique({
        where: { channelId: channel.id },
      });

      if (!ticket) {
        const reply = await channel.send(await GT(guild.id, locale, 'ticket.close.not_ticket'));
        setTimeout(() => reply.delete().catch(() => {}), 5000);
        return;
      }

      // Tạo container close với Components V2
      const container = EmbedComponentsV2.createContainer();
      
      container.addTextDisplay(`## ${await GT(guild.id, locale, 'ticket.close.embed_title')}`);
      container.addSeparator({ divider: true });
      container.addTextDisplay(await GT(guild.id, locale, 'ticket.close.embed_description'));
      container.addSeparator({ divider: true });
      
      // Button đóng ticket
      container.addButton(
        await GT(guild.id, locale, 'ticket.close.button_close'),
        `ticket_close_${channel.id}`,
        ButtonStyle.Danger,
        { emoji: '🗑️' }
      );
      
      container.addTextDisplay(`-# J & D Store - Ticket System • <t:${Math.floor(Date.now() / 1000)}:f>`);

      await channel.send(container.build());
    } catch (error) {
      console.error('Lỗi khi tạo close embed:', error);
      const reply = await channel.send(await GT(guild.id, locale, 'ticket.close.error'));
      setTimeout(() => reply.delete().catch(() => {}), 5000);
    }
  },
};
