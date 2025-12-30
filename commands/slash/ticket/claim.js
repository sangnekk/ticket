const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { prisma, getGuildLanguage } = require('../../../utils/prisma');
const { GT } = require('../../../utils/guildI18n');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim ticket này (dành cho Staff)'),

  async execute(interaction, client) {
    const { guild, channel, user } = interaction;

    // Lấy ngôn ngữ
    let locale = await getGuildLanguage(guild.id);
    if (!locale) locale = 'Vietnamese';

    await interaction.deferReply({ ephemeral: true });

    try {
      // Lấy config ticket
      const config = await prisma.ticketConfig.findUnique({
        where: { guildId: guild.id },
      });

      if (!config) {
        return interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.claim.not_setup'),
        });
      }

      // Kiểm tra user có phải staff không
      const member = await guild.members.fetch(user.id);
      const isStaff = member.roles.cache.has(config.staffRoleId);

      if (!isStaff) {
        return interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.claim.not_staff'),
        });
      }

      // Kiểm tra channel có phải ticket không
      const ticket = await prisma.ticket.findUnique({
        where: { channelId: channel.id },
      });

      if (!ticket) {
        return interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.claim.not_ticket'),
        });
      }

      // Kiểm tra ticket đã được claim chưa
      if (ticket.claimedBy) {
        const claimedUser = await client.users.fetch(ticket.claimedBy).catch(() => null);
        return interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.claim.already_claimed', {
            staff: claimedUser ? claimedUser.tag : 'một staff khác',
          }),
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

      // Gửi embed thông báo
      const claimEmbed = new EmbedBuilder()
        .setTitle(await GT(guild.id, locale, 'ticket.claim.embed_title'))
        .setDescription(await GT(guild.id, locale, 'ticket.claim.embed_description', { staff: `${user}` }))
        .setColor('#00FF00')
        .setTimestamp();

      await channel.send({ embeds: [claimEmbed] });

      await interaction.editReply({
        content: await GT(guild.id, locale, 'ticket.claim.success'),
      });
    } catch (error) {
      console.error('Lỗi khi claim ticket:', error);
      await interaction.editReply({
        content: await GT(guild.id, locale, 'ticket.claim.error'),
      });
    }
  },
};
