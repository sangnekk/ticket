const {
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const { prisma, getGuildLanguage } = require('../utils/prisma');
const { GT } = require('../utils/guildI18n');
const EmbedComponentsV2 = require('../utils/embedComponentsV2');

module.exports = {
  customId: 'ticket_create_*',

  async execute(interaction, client) {
    const { guild, user, customId } = interaction;
    const buttonType = customId.split('_')[2]; // buy hoặc support

    // Lấy ngôn ngữ
    let locale = await getGuildLanguage(guild.id);
    if (!locale) locale = 'Vietnamese';

    await interaction.deferReply({ flags: 64 });

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

      // Tạo container chào mừng trong ticket với EmbedComponentsV2
      const typeEmoji = buttonType === 'buy' 
        ? await GT(guild.id, locale, 'ticket.setup.button_buy_emoji')
        : await GT(guild.id, locale, 'ticket.setup.button_support_emoji');
      const welcomeImage = await GT(guild.id, locale, 'ticket.create.welcome_image');
      
      const welcomeContainer = EmbedComponentsV2.createContainer();
      
      // Title
      welcomeContainer.addTextDisplay(
        `## ${await GT(guild.id, locale, 'ticket.create.welcome_title', { type: typeName })}`
      );
      welcomeContainer.addSeparator({ divider: true });
      
      // Description
      welcomeContainer.addTextDisplay(
        await GT(guild.id, locale, 'ticket.create.welcome_description', {
          user: `${user}`,
          typeEmoji: typeEmoji,
          type: typeName,
          ticketNumber: ticketNumber,
        })
      );

      // Thêm MediaGallery nếu có image
      if (welcomeImage && welcomeImage !== 'ticket.create.welcome_image') {
        const gallery = new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(welcomeImage)
        );
        welcomeContainer.addMediaGallery(gallery);
      }

      welcomeContainer.addSeparator({ divider: true });
      welcomeContainer.addTextDisplay(
        `-# J & D Store - Ticket System • <t:${Math.floor(Date.now() / 1000)}:f>`
      );    
      // Then send the Components V2 message (không có content)
      const containerPayload = welcomeContainer.build();
      await ticketChannel.send(containerPayload);

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
