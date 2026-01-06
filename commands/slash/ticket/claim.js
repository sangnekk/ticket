const {
  SlashCommandBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require('discord.js');
const { prisma, getGuildLanguage } = require('../../../utils/prisma');
const { GT } = require('../../../utils/guildI18n');
const EmbedComponentsV2 = require('../../../utils/embedComponentsV2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim ticket này (dành cho Staff)'),

  async execute(interaction, client) {
    const { guild, channel, user } = interaction;

    // Lấy ngôn ngữ
    let locale = await getGuildLanguage(guild.id);
    if (!locale) locale = 'Vietnamese';

    // Defer reply ephemeral (chỉ user nhìn thấy)
    try {
      await interaction.deferReply({ ephemeral: true });
    } catch (deferError) {
      console.error('Không thể defer reply:', deferError);
      return; // Interaction đã hết hạn, không thể xử lý
    }

    try {
      // Lấy config ticket
      const config = await prisma.ticketConfig.findUnique({
        where: { guildId: guild.id },
      });

      if (!config) {
        return await interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.claim.not_setup'),
        }).catch(err => {
          console.error('Không thể edit reply (not_setup):', err);
        });
      }

      // Kiểm tra user có phải staff không
      const member = await guild.members.fetch(user.id);
      const isStaff = member.roles.cache.has(config.staffRoleId);

      if (!isStaff) {
        return await interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.claim.not_staff'),
        }).catch(err => {
          console.error('Không thể edit reply (not_staff):', err);
        });
      }

      // Kiểm tra channel có phải ticket không
      const ticket = await prisma.ticket.findUnique({
        where: { channelId: channel.id },
      });

      if (!ticket) {
        return await interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.claim.not_ticket'),
        }).catch(err => {
          console.error('Không thể edit reply (not_ticket):', err);
        });
      }

      // Kiểm tra ticket đã được claim chưa
      if (ticket.claimedBy) {
        const claimedUser = await client.users.fetch(ticket.claimedBy).catch(() => null);
        return await interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.claim.already_claimed', {
            staff: claimedUser ? claimedUser.tag : 'một staff khác',
          }),
        }).catch(err => {
          console.error('Không thể edit reply (already_claimed):', err);
        });
      }

      // Cập nhật ticket
      await prisma.ticket.update({
        where: { channelId: channel.id },
        data: { claimedBy: user.id },
      });

      // Lấy thông tin user tạo ticket
      const ticketOwner = await client.users.fetch(ticket.userId).catch(() => null);
      const ownerName = ticketOwner ? ticketOwner.username : 'Unknown';

      // Cập nhật topic channel
      await channel.setTopic(`Ticket opened by "${ownerName}" | claimed by ${user.username}`);
      // Reply ephemeral cho user
      await interaction.editReply({
        content: await GT(guild.id, locale, 'ticket.claim.success'),
      }).catch(err => {
        console.error('Không thể edit reply (success):', err);
      });
    } catch (error) {
      console.error('Lỗi khi claim ticket:', error);
      
      // Kiểm tra xem interaction còn valid không
      try {
        await interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.claim.error'),
        });
      } catch (replyError) {
        console.error('Không thể edit reply (error):', replyError);
        // Interaction đã hết hạn, không thể phản hồi
      }
    }
  },
};
