const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');
const { prisma } = require('../../../utils/prisma');
const { getGuildLanguage } = require('../../../utils/prisma');
const { GT } = require('../../../utils/guildI18n');

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

  async execute(interaction, client) {
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
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel('channel');
    const category1 = interaction.options.getChannel('category1');
    const category2 = interaction.options.getChannel('category2');
    const staffRole = interaction.options.getRole('staff');
    const dmRole = interaction.options.getRole('dm_role');

    await interaction.deferReply({ ephemeral: true });

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

      // Tạo embed ticket
      const ticketEmbed = new EmbedBuilder()
        .setTitle(await GT(guild.id, locale, 'ticket.setup.embed_title'))
        .setDescription(await GT(guild.id, locale, 'ticket.setup.embed_description'))
        .setColor('#5865F2')
        .setFooter({ text: 'J & D Store - Ticket System' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_create_buy')
          .setLabel(await GT(guild.id, locale, 'ticket.setup.button_buy'))
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('ticket_create_support')
          .setLabel(await GT(guild.id, locale, 'ticket.setup.button_support'))
          .setStyle(ButtonStyle.Secondary)
      );

      // Gửi embed vào channel
      await channel.send({ embeds: [ticketEmbed], components: [row] });

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
