const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { prisma, getGuildLanguage } = require('../../../utils/prisma');
const { GT } = require('../../../utils/guildI18n');

module.exports = {
  name: 'close',
  description: 'Tạo embed với nút đóng ticket',
  usage: '+close',
  category: 'Ticket',

  async execute(message, args, client) {
    const { guild, channel, author } = message;

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

      // Tạo embed close
      const closeEmbed = new EmbedBuilder()
        .setTitle(await GT(guild.id, locale, 'ticket.close.embed_title'))
        .setDescription(await GT(guild.id, locale, 'ticket.close.embed_description'))
        .setColor('#FF6B6B')
        .setFooter({ text: 'J & D Store - Ticket System' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_close_${channel.id}`)
          .setLabel(await GT(guild.id, locale, 'ticket.close.button_close'))
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({ embeds: [closeEmbed], components: [row] });
    } catch (error) {
      console.error('Lỗi khi tạo close embed:', error);
      const reply = await channel.send(await GT(guild.id, locale, 'ticket.close.error'));
      setTimeout(() => reply.delete().catch(() => {}), 5000);
    }
  },
};
