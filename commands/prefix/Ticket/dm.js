const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const { prisma, getGuildLanguage } = require('../../../utils/prisma');
const { GT } = require('../../../utils/guildI18n');

module.exports = {
  name: 'dm',
  description: 'Gửi thông báo hoàn thành đơn hàng cho user',
  usage: '+dm @user <reason>',
  category: 'Ticket',

  async execute(message, args, client) {
    const { guild, channel, author, member } = message;

    // Lấy ngôn ngữ
    let locale = await getGuildLanguage(guild.id);
    if (!locale) locale = 'Vietnamese';

    try {
      // Lấy config
      const config = await prisma.ticketConfig.findUnique({
        where: { guildId: guild.id },
      });

      if (!config) {
        return message.reply(await GT(guild.id, locale, 'ticket.dm.not_setup'));
      }

      // Kiểm tra quyền: Administrator hoặc có dmRoleId
      const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
      const hasDmRole = config.dmRoleId && member.roles.cache.has(config.dmRoleId);

      if (!isAdmin && !hasDmRole) {
        return message.reply(await GT(guild.id, locale, 'ticket.dm.no_permission'));
      }

      // Kiểm tra có phải ticket không
      const ticket = await prisma.ticket.findUnique({
        where: { channelId: channel.id },
      });

      if (!ticket) {
        return message.reply(await GT(guild.id, locale, 'ticket.dm.not_ticket'));
      }

      // Lấy user được mention
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        return message.reply(await GT(guild.id, locale, 'ticket.dm.no_user'));
      }

      // Lấy reason (bỏ mention ra)
      const reason = args.slice(1).join(' ');
      if (!reason) {
        return message.reply(await GT(guild.id, locale, 'ticket.dm.no_reason'));
      }

      // Xóa lệnh
      await message.delete().catch(() => {});

      // Tạo embed gửi vào ticket
      const ticketEmbed = new EmbedBuilder()
        .setTitle(await GT(guild.id, locale, 'ticket.dm.ticket_embed_title'))
        .setDescription(await GT(guild.id, locale, 'ticket.dm.ticket_embed_description', {
          user: `${targetUser}`,
          reason: reason,
          staff: `${author}`,
        }))
        .setColor('#00FF00')
        .setFooter({ text: 'J & D Store' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_close_${channel.id}`)
          .setLabel(await GT(guild.id, locale, 'ticket.dm.button_delete'))
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({ embeds: [ticketEmbed], components: [row] });

      // Tạo embed gửi DM cho user
      const dmEmbed = new EmbedBuilder()
        .setTitle(await GT(guild.id, locale, 'ticket.dm.dm_embed_title'))
        .setDescription(await GT(guild.id, locale, 'ticket.dm.dm_embed_description', {
          staff: author.username,
          reason: reason,
          channel: `<#${channel.id}>`,
        }))
        .setColor('#5865F2')
        .setFooter({ text: 'J & D Store - Cảm ơn bạn!' })
        .setTimestamp();

      // Gửi DM
      try {
        await targetUser.send({ embeds: [dmEmbed] });
        
        // Thông báo đã gửi DM thành công
        const successMsg = await channel.send(await GT(guild.id, locale, 'ticket.dm.dm_success', { user: `${targetUser}` }));
        setTimeout(() => successMsg.delete().catch(() => {}), 5000);
      } catch (dmError) {
        // Nếu không gửi được DM
        await channel.send(await GT(guild.id, locale, 'ticket.dm.dm_failed', { user: `${targetUser}` }));
      }
    } catch (error) {
      console.error('Lỗi khi thực hiện lệnh dm:', error);
      message.reply(await GT(guild.id, locale, 'ticket.dm.error')).catch(() => {});
    }
  },
};
