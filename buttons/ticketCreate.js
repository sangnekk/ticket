const {
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const { MessageFlags } = require('discord-api-types/v10');
const { prisma, getGuildLanguage } = require('../utils/prisma');
const { GT, getEmbedOverride } = require('../utils/guildI18n');

module.exports = {
  customId: 'ticket_create_*',

  async execute(interaction, client) {
    const { guild, user, customId } = interaction;
    const buttonType = customId.split('_')[2]; // buy hoặc support

    // Lấy ngôn ngữ
    let locale = await getGuildLanguage(guild.id);
    if (!locale) locale = 'Vietnamese';

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      // Lấy config ticket
      const config = await prisma.ticketConfig.findUnique({
        where: { guildId: guild.id },
      });

      if (!config) {
        await interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.create.not_setup'),
        });
        return;
      }

      // Kiểm tra user đã có ticket loại này chưa
      const existingTicket = await prisma.ticket.findFirst({
        where: {
          guildId: guild.id,
          userId: user.id,
          buttonType: buttonType,
          status: 'open',
        },
      });

      const typeName = buttonType === 'buy' 
        ? await GT(guild.id, locale, 'ticket.create.type_buy')
        : await GT(guild.id, locale, 'ticket.create.type_support');

      if (existingTicket) {
        await interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.create.already_have', {
            type: typeName,
            channel: `<#${existingTicket.channelId}>`,
          }),
        });
        return;
      }

      // Tăng counter và lấy số ticket mới
      const updatedConfig = await prisma.ticketConfig.update({
        where: { guildId: guild.id },
        data: { ticketCounter: { increment: 1 } },
      });

      const ticketNumber = updatedConfig.ticketCounter;
      const ticketName = `ticket-${String(ticketNumber).padStart(3, '0')}`;

      // Kiểm tra category nào còn chỗ
      let category = await guild.channels.fetch(config.categoryId1).catch(() => null);
      if (category && category.children.cache.size >= 50) {
        category = await guild.channels.fetch(config.categoryId2).catch(() => null);
      }

      if (!category) {
        await interaction.editReply({
          content: await GT(guild.id, locale, 'ticket.create.no_category'),
        });
        return;
      }

      // Tạo channel ticket
      const ticketChannel = await guild.channels.create({
        name: ticketName,
        type: ChannelType.GuildText,
        parent: category.id,
        topic: `Ticket opened by "${user.username}"`,
        permissionOverwrites: [
          {
            id: guild.id, // @everyone
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: user.id, // User tạo ticket
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
            ],
          },
          {
            id: config.staffRoleId, // Staff role
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages,
              PermissionFlagsBits.AttachFiles,
            ],
          },
        ],
      });

      // Lưu ticket vào database
      await prisma.ticket.create({
        data: {
          guildId: guild.id,
          channelId: ticketChannel.id,
          userId: user.id,
          buttonType: buttonType,
          ticketNumber: ticketNumber,
        },
      });

      // Tạo embed chào mừng trong ticket
      const typeEmoji = buttonType === 'buy' ? '📦' : '❓';
      const welcomeEmbed = new EmbedBuilder()
        .setTitle(await GT(guild.id, locale, 'ticket.create.welcome_title', { type: typeName }))
        .setDescription(await GT(guild.id, locale, 'ticket.create.welcome_description', {
          user: `${user}`,
          typeEmoji: typeEmoji,
          type: typeName,
          ticketNumber: ticketNumber,
        }))
        .setColor(buttonType === 'buy' ? '#5865F2' : '#FFA500')
        .setFooter({ text: 'J & D Store - Ticket System' })
        .setTimestamp();

      await ticketChannel.send({
        content: `${user} | <@&${config.staffRoleId}>`,
        embeds: [welcomeEmbed],
      });

      await interaction.editReply({
        content: await GT(guild.id, locale, 'ticket.create.success', { channel: `${ticketChannel}` }),
      });
    } catch (error) {
      console.error('Lỗi khi tạo ticket:', error);
      await interaction.editReply({
        content: await GT(guild.id, locale, 'ticket.create.error'),
      });
    }
  },
};
