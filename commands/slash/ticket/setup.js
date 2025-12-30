const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const { prisma } = require('../../../utils/prisma');
const { getGuildLanguage } = require('../../../utils/prisma');
const { GT } = require('../../../utils/guildI18n');
const EmbedComponentsV2 = require('../../../utils/embedComponentsV2');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Thiết lập hệ thống ticket')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel để gửi embed tạo ticket')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('category1')
        .setDescription('Category chính cho ticket')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('category2')
        .setDescription('Category dự phòng khi category 1 đầy')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName('staff')
        .setDescription('Role staff có quyền xem ticket')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName('dm_role')
        .setDescription('Role được phép dùng lệnh +dm (ngoài Administrator)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const { guild, user } = interaction;
    const config = require('../../../config.json');

    // Lấy ngôn ngữ
    let locale = await getGuildLanguage(guild.id);
    if (!locale) locale = 'Vietnamese';

    // Kiểm tra quyền: chỉ owner server hoặc dev
    const isOwner = user.id === config.OwnerId;
    const isDev = user.id === config.DevID;

    if (!isOwner && !isDev) {
      return interaction.reply({
        content: await GT(guild.id, locale, 'ticket.setup.only_owner_dev'),
        flags: 64, // Ephemeral
      });
    }

    const channel = interaction.options.getChannel('channel');
    const category1 = interaction.options.getChannel('category1');
    const category2 = interaction.options.getChannel('category2');
    const staffRole = interaction.options.getRole('staff');
    const dmRole = interaction.options.getRole('dm_role');

    await interaction.deferReply({ flags: 64 });

    try {
      // Lưu config vào database
      await prisma.ticketConfig.upsert({
        where: { guildId: guild.id },
        update: {
          channelId: channel.id,
          categoryId1: category1.id,
          categoryId2: category2.id,
          staffRoleId: staffRole.id,
          dmRoleId: dmRole?.id || null,
        },
        create: {
          guildId: guild.id,
          channelId: channel.id,
          categoryId1: category1.id,
          categoryId2: category2.id,
          staffRoleId: staffRole.id,
          dmRoleId: dmRole?.id || null,
        },
      });

      // Lấy các label và emoji trước
      const embedTitle = await GT(guild.id, locale, 'ticket.setup.embed_title');
      const embedDescription = await GT(guild.id, locale, 'ticket.setup.embed_description');
      const embedImage = await GT(guild.id, locale, 'ticket.setup.embed_image');
      const buttonBuyLabel = await GT(guild.id, locale, 'ticket.setup.button_buy');
      const buttonBuyEmoji = await GT(guild.id, locale, 'ticket.setup.button_buy_emoji');
      const buttonSupportLabel = await GT(guild.id, locale, 'ticket.setup.button_support');
      const buttonSupportEmoji = await GT(guild.id, locale, 'ticket.setup.button_support_emoji');

      // Tạo container ticket với EmbedComponentsV2
      const container = EmbedComponentsV2.createContainer();

      // Title
      container.addTextDisplay(`## ${embedTitle}`);
      container.addSeparator({ divider: true });

      // Description
      container.addTextDisplay(embedDescription);

      // Thêm image nếu có (dùng markdown image hoặc MediaGallery nếu discord.js hỗ trợ)
      if (embedImage && embedImage !== 'ticket.setup.embed_image') {
        try {
          // Thử dùng MediaGallery nếu discord.js version hỗ trợ
          const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
          if (MediaGalleryBuilder && MediaGalleryItemBuilder) {
            const gallery = new MediaGalleryBuilder().addItems(
              new MediaGalleryItemBuilder().setURL(embedImage)
            );
            container.addMediaGallery(gallery);
          } else {
            // Fallback: hiển thị link image
            container.addTextDisplay(`[​](${embedImage})`);
          }
        } catch {
          // Fallback: hiển thị link image
          container.addTextDisplay(`[​](${embedImage})`);
        }
      }

      container.addSeparator({ divider: true });

      // Buttons
      container.addButton(buttonBuyLabel, 'ticket_create_buy', ButtonStyle.Primary, {
        emoji: buttonBuyEmoji,
      });
      container.addButton(buttonSupportLabel, 'ticket_create_support', ButtonStyle.Secondary, {
        emoji: buttonSupportEmoji,
      });

      // Footer
      container.addTextDisplay(`-# J & D Store - Ticket System • <t:${Math.floor(Date.now() / 1000)}:f>`);

      // Gửi container vào channel
      await channel.send(container.build());

      let successMsg = await GT(guild.id, locale, 'ticket.setup.success') + '\n\n';
      successMsg += await GT(guild.id, locale, 'ticket.setup.success_detail', {
        channel: `${channel}`,
        category1: category1.name,
        category2: category2.name,
        staffRole: `${staffRole}`,
      });
      
      if (dmRole) {
        successMsg += '\n' + await GT(guild.id, locale, 'ticket.setup.dm_role', { dmRole: `${dmRole}` });
      }

      await interaction.editReply({ content: successMsg });
    } catch (error) {
      console.error('Lỗi khi setup ticket:', error);
      await interaction.editReply({
        content: await GT(guild.id, locale, 'ticket.setup.error'),
      });
    }
  },
};
