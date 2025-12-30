const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { T } = require('../../../plugins/i18n');
const { GT } = require('../../../utils/guildI18n');
const { getGuildLanguage } = require('../../../utils/prisma');

/**
 * Đây là file mẫu hướng dẫn tạo lệnh với đầy đủ các thông số.
 * Sử dụng file này làm tham khảo khi tạo lệnh mới để đảm bảo
 * tích hợp đầy đủ với hệ thống help và các tính năng khác.
 */
module.exports = {
  // Tên của lệnh (bắt buộc)
  // Được sử dụng để gọi lệnh và hiển thị trong help
  name: 'example',

  // Mô tả ngắn gọn về lệnh (bắt buộc)
  // Hiển thị trong danh sách lệnh của help
  description: 'Ví dụ về lệnh sử dụng đầy đủ tính năng của hệ thống',

  // Danh sách tên thay thế cho lệnh (tùy chọn)
  // Người dùng có thể sử dụng các tên này thay cho tên chính
  aliases: ['ex', 'demo'],

  // Cú pháp sử dụng lệnh (tùy chọn nhưng khuyến khích có)
  // Hiển thị trong phần "Cách sử dụng" của help
  // Sử dụng [] cho tham số tùy chọn và <> cho tham số bắt buộc
  usage: '[tham_số_1] [tham_số_2]',

  // Ví dụ về cách sử dụng lệnh (tùy chọn nhưng khuyến khích có)
  // Hiển thị trong phần "Ví dụ" của help
  examples: ['', 'hello', 'hello world'],

  // Thời gian chờ giữa các lần sử dụng lệnh, tính bằng giây (tùy chọn)
  // Ngăn người dùng spam lệnh
  cooldown: 5,

  // Phân loại theo danh mục (tùy chọn)
  // Được xác định tự động dựa trên thư mục chứa file
  category: 'Server',

  // Quyền cần thiết để sử dụng lệnh (tùy chọn)
  // Kiểm tra trước khi thực thi lệnh
  permissions: {
    bot: ['SendMessages', 'EmbedLinks'],
    user: ['ManageMessages'], // Yêu cầu quyền quản lý tin nhắn
  },

  // Hàm thực thi khi lệnh được gọi (bắt buộc)
  async execute(message, args, client) {
    // Lấy ngôn ngữ của người dùng từ database
    let userLocale = await getGuildLanguage(message.guild.id);
    if (!userLocale) {
      userLocale = message.guild?.preferredLocale || client.config?.defaultLanguage || 'Vietnamese';
    }

    // Tạo các button tương tác
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('example_success')
        .setLabel(await GT(message.guild?.id, userLocale, 'success_general'))
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId('example_error')
        .setLabel(await GT(message.guild?.id, userLocale, 'error_general'))
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌'),
      new ButtonBuilder()
        .setCustomId('example_info')
        .setLabel(await GT(message.guild?.id, userLocale, 'example.info_button'))
        .setStyle(ButtonStyle.Primary)
        .setEmoji('ℹ️')
    );

    // Tạo embed chính
    const mainEmbed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle(await GT(message.guild?.id, userLocale, 'example.title'))
      .setDescription(await GT(message.guild?.id, userLocale, 'example.description'))
      .addFields([
        {
          name: await GT(message.guild?.id, userLocale, 'example.basic_params'),
          value: await GT(message.guild?.id, userLocale, 'example.basic_params_detail'),
          inline: true,
        },
        {
          name: await GT(message.guild?.id, userLocale, 'example.advanced_params'),
          value: await GT(message.guild?.id, userLocale, 'example.advanced_params_detail'),
          inline: true,
        },
        {
          name: await GT(message.guild?.id, userLocale, 'example.help_integration'),
          value: await GT(message.guild?.id, userLocale, 'example.help_integration_detail'),
          inline: true,
        },
        {
          name: await GT(message.guild?.id, userLocale, 'example.interaction'),
          value: await GT(message.guild?.id, userLocale, 'example.interaction_detail'),
          inline: true,
        },
        {
          name: await GT(message.guild?.id, userLocale, 'example.result'),
          value: await GT(message.guild?.id, userLocale, 'example.result_detail'),
          inline: true,
        },
        {
          name: await GT(message.guild?.id, userLocale, 'example.docs'),
          value: await GT(message.guild?.id, userLocale, 'example.docs_detail'),
          inline: true,
        },
      ])
      .setFooter({
        text: `${await GT(
          message.guild?.id,
          userLocale,
          'use_many.request_by'
        )} ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    // Tạo một file đính kèm (ví dụ)
    const attachment = {
      attachment: Buffer.from('Đây là nội dung file ví dụ'),
      name: 'example.txt',
    };

    // Trả về kết quả phức hợp
    // Lưu ý: Cấu trúc trả về này được xử lý bởi hệ thống phản hồi của bot
    return {
      content: '📝 ' + (await GT(message.guild?.id, userLocale, 'example.title')),
      embed: mainEmbed,
      components: [buttons],
      files: [attachment],
      ephemeral: false,
      // Có thể thêm các tùy chọn khác tùy nhu cầu
      extras: {
        type: 'complex_example',
        timestamp: Date.now(),
        author: message.author.id,
      },
    };
  },

  // Xử lý tương tác với buttons (tùy chọn)
  // Được gọi khi người dùng nhấn vào button trả về từ lệnh này
  async buttonHandler(interaction) {
    // Lấy ngôn ngữ của người dùng
    let userLocale = await getGuildLanguage(interaction.guild.id);
    if (!userLocale) {
      userLocale = interaction.guild?.preferredLocale || 'Vietnamese';
    }

    const buttonId = interaction.customId;

    switch (buttonId) {
      case 'example_success':
        return {
          content: T(userLocale, 'example.success_button'),
          ephemeral: true,
        };

      case 'example_error':
        return {
          content: T(userLocale, 'example.error_button'),
          ephemeral: true,
        };

      case 'example_info':
        const infoEmbed = new EmbedBuilder()
          .setColor('#3498db')
          .setTitle(
            'ℹ️ ' + (await GT(message.guild?.id, userLocale, 'example.info_button'))
          )
          .setDescription(
            await GT(message.guild?.id, userLocale, 'example.info_desc')
          )
          .addFields([
            {
              name: await GT(message.guild?.id, userLocale, 'example.creator'),
              value: interaction.user.tag,
              inline: true,
            },
            {
              name: await GT(message.guild?.id, userLocale, 'example.time'),
              value: new Date().toLocaleString(),
              inline: true,
            },
          ]);

        return {
          embeds: [infoEmbed],
          ephemeral: true,
        };
    }
  },
};
