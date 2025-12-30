const { EmbedBuilder } = require('discord.js');
const { MessageFlags } = require('discord-api-types/v10');
const { prisma, getGuildLanguage } = require('../utils/prisma');
const { GT } = require('../utils/guildI18n');

module.exports = {
  customId: 'ticket_close_*',

  async execute(interaction, client) {
    const { guild, channel, user } = interaction;

    // Lấy ngôn ngữ
    let locale = await getGuildLanguage(guild.id);
    if (!locale) locale = 'Vietnamese';

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
        const denyEmbed = new EmbedBuilder()
          .setTitle(await GT(guild.id, locale, 'ticket.close.denied_title'))
          .setDescription(await GT(guild.id, locale, 'ticket.close.denied_description'))
          .setColor('#FF0000')
          .setTimestamp();

        return interaction.editReply({
          embeds: [denyEmbed],
        });
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
        const denyEmbed = new EmbedBuilder()
          .setTitle(await GT(guild.id, locale, 'ticket.close.denied_title'))
          .setDescription(await GT(guild.id, locale, 'ticket.close.denied_description'))
          .setColor('#FF0000')
          .setTimestamp();

        return interaction.editReply({
          embeds: [denyEmbed],
        });
      }
    } catch (error) {
      console.error('Lỗi khi close ticket:', error);
      await interaction.editReply({
        content: await GT(guild.id, locale, 'ticket.close.error'),
      });
    }
  },
};
