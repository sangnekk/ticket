const {
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require('discord.js');
const { prisma, getGuildLanguage } = require('../utils/prisma');
const { GT } = require('../utils/guildI18n');
const EmbedComponentsV2 = require('../utils/embedComponentsV2');

module.exports = {
  customId: 'ticket_close_*',

  async execute(interaction, client) {
    const { guild, channel, user } = interaction;

    // Lấy ngôn ngữ
    let locale = await getGuildLanguage(guild.id);
    if (!locale) locale = 'Vietnamese';

    await interaction.deferReply({ flags: 64 });

    try {
      // Lấy ticket info
      const ticket = await prisma.ticket.findUnique({
        where: { channelId: channel.id },
      });

      if (!ticket) {
        return interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.close.not_ticket'),
        });
      }

      // Lấy config
      const config = await prisma.ticketConfig.findUnique({
        where: { guildId: guild.id },
      });

      if (!config) {
        return interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.close.no_config'),
        });
      }

      // Kiểm tra user có phải staff không
      const member = await guild.members.fetch(user.id);
      const isStaff = member.roles.cache.has(config.staffRoleId);
      const isAdmin = member.permissions.has('Administrator');

      // Nếu ticket đã được claim, user không thể tự xóa
      if (ticket.claimedBy && !isStaff && !isAdmin) {
        const deniedImage = await GT(guild.id, locale, 'ticket.close.denied_image');
        
        const denyContainer = EmbedComponentsV2.createContainer();
        denyContainer.addTextDisplay(
          `## ${await GT(guild.id, locale, 'ticket.close.denied_title')}`
        );
        denyContainer.addSeparator({ divider: true });
        denyContainer.addTextDisplay(
          await GT(guild.id, locale, 'ticket.close.denied_description', {
            user: `${user}`,
          })
        );

        // Thêm MediaGallery nếu có image
        if (deniedImage && deniedImage !== 'ticket.close.denied_image') {
          const gallery = new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(deniedImage)
          );
          denyContainer.addMediaGallery(gallery);
        }

        denyContainer.addTextDisplay(
          `-# <t:${Math.floor(Date.now() / 1000)}:f>`
        );

        // Xóa deferred reply và gửi message mới để MediaGallery hiển thị đúng
        await interaction.deleteReply().catch(() => {});
        return channel.send(denyContainer.build());
      }

      // Nếu là staff hoặc admin, xóa ticket
      if (isStaff || isAdmin) {
        await interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.close.deleting'),
        });

        // Cập nhật status ticket
        await prisma.ticket.update({
          where: { channelId: channel.id },
          data: {
            status: 'closed',
            closedAt: new Date(),
          },
        });

        // Xóa channel sau 3 giây
        setTimeout(async () => {
          try {
            await channel.delete('Ticket closed');
          } catch (err) {
            console.error('Lỗi khi xóa channel ticket:', err);
          }
        }, 3000);
      } else {
        // User thường không có quyền xóa
        const deniedImage = await GT(guild.id, locale, 'ticket.close.denied_image');
        
        const denyContainer = EmbedComponentsV2.createContainer();
        denyContainer.addTextDisplay(
          `## ${await GT(guild.id, locale, 'ticket.close.denied_title')}`
        );
        denyContainer.addSeparator({ divider: true });
        denyContainer.addTextDisplay(
          await GT(guild.id, locale, 'ticket.close.denied_description', {
            user: `${user}`,
          })
        );

        // Thêm MediaGallery nếu có image
        if (deniedImage && deniedImage !== 'ticket.close.denied_image') {
          const gallery = new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(deniedImage)
          );
          denyContainer.addMediaGallery(gallery);
        }

        denyContainer.addTextDisplay(
          `-# <t:${Math.floor(Date.now() / 1000)}:f>`
        );

        // Xóa deferred reply và gửi message mới để MediaGallery hiển thị đúng
        await interaction.deleteReply().catch(() => {});
        return channel.send(denyContainer.build());
      }
    } catch (error) {
      console.error('Lỗi khi close ticket:', error);
      await interaction.editReply({
        content: await GT(guild.id, locale, 'ticket.close.error'),
      });
    }
  },
};
