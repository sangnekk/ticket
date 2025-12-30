const { ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { prisma, getGuildLanguage } = require('../../../utils/prisma');
const { GT } = require('../../../utils/guildI18n');
const EmbedComponentsV2 = require('../../../utils/embedComponentsV2');

module.exports = {
  name: 'dm',
  description: 'Gửi thông báo hoàn thành đơn hàng cho user',
  usage: '+dm @user <reason>',
  category: 'Ticket',

  async execute(message, args) {
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

      // Tạo container gửi vào ticket với Components V2
      const ticketContainer = EmbedComponentsV2.createContainer();
      
      ticketContainer.addTextDisplay(`## ${await GT(guild.id, locale, 'ticket.dm.ticket_embed_title')}`);
      ticketContainer.addSeparator({ divider: true });
      ticketContainer.addTextDisplay(await GT(guild.id, locale, 'ticket.dm.ticket_embed_description', {
        user: `${targetUser}`,
        reason: reason,
        staff: `${author}`,
      }));
      ticketContainer.addSeparator({ divider: true });
      
      // Button xóa ticket
      ticketContainer.addButton(
        await GT(guild.id, locale, 'ticket.dm.button_delete'),
        `ticket_close_${channel.id}`,
        ButtonStyle.Danger,
        { emoji: '🗑️' }
      );
      
      ticketContainer.addTextDisplay(`-# J & D Store • <t:${Math.floor(Date.now() / 1000)}:f>`);

      await channel.send(ticketContainer.build());

      // Tạo container gửi DM cho user với Components V2
      const dmContainer = EmbedComponentsV2.createContainer();
      
      dmContainer.addTextDisplay(`## ${await GT(guild.id, locale, 'ticket.dm.dm_embed_title')}`);
      dmContainer.addSeparator({ divider: true });
      dmContainer.addTextDisplay(await GT(guild.id, locale, 'ticket.dm.dm_embed_description', {
        staff: author.username,
        reason: reason,
        channel: `<#${channel.id}>`,
      }));
      dmContainer.addTextDisplay(`-# J & D Store - Cảm ơn bạn! • <t:${Math.floor(Date.now() / 1000)}:f>`);

      // Gửi DM
      try {
        await targetUser.send(dmContainer.build());
        
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
