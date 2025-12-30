// leave.js
const { EmbedBuilder } = require('discord.js');
const { DevID } = require('../../../config.json');
const { T } = require('../../../plugins/i18n');
const { GT } = require('../../../utils/guildI18n');
const { getGuildLanguage } = require('../../../utils/prisma');

module.exports = {
  name: 'leave',
  description: 'Rời khỏi server',
  aliases: ['exit'],
  usage: '',
  examples: [''],
  cooldown: 5,
  permissions: {
    bot: ['SendMessages'],
    user: ['Administrator'], // Yêu cầu quyền quản trị viên
  },

  async execute(message, args, client) {
    // Lấy ngôn ngữ của người dùng từ database
    let userLocale = await getGuildLanguage(message.guild.id);
    if (!userLocale) {
      userLocale = message.guild?.preferredLocale || client.config?.defaultLanguage || 'Vietnamese';
    }

    try {
      // Gửi tin nhắn trước khi rời khỏi server
      await message.channel.send(
        await GT(message.guild?.id, userLocale, 'success.leave')
      );

      // Rời khỏi server sau 3 giây
      setTimeout(async () => {
        try {
          await message.guild.leave();
        } catch (error) {
          console.error('Lỗi khi rời khỏi server:', error);

          // Nếu đã gửi tin nhắn thành công nhưng không thể rời khỏi server
          try {
            await message.channel.send(
              await GT(message.guild?.id, userLocale, 'error.leave')
            );
          } catch (err) {
            // Bỏ qua lỗi nếu không thể gửi tin nhắn
          }
        }
      }, 3000);

      // Không cần trả về gì vì đã gửi tin nhắn trực tiếp
      return null;
    } catch (error) {
      console.error('Lỗi khi thực thi lệnh leave:', error);
      return {
        content: await GT(message.guild?.id, userLocale, 'error.leave'),
        ephemeral: true,
      };
    }
  },
};
