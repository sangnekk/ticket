const { T } = require('../../../plugins/i18n');
const { GT } = require('../../../utils/guildI18n');
const { getGuildLanguage } = require('../../../utils/prisma');

module.exports = {
  name: 'restart',
  description: 'Khởi động lại bot',
  aliases: ['reboot'],
  usage: '',
  examples: [''],
  cooldown: 60,
  permissions: {
    bot: ['SendMessages'],
    user: 'DEV', // Chỉ developer mới có thể sử dụng
  },

  async execute(message, args, client) {
    // Lấy ngôn ngữ của người dùng từ database
    let userLocale = await getGuildLanguage(message.guild.id);
    if (!userLocale) {
      userLocale = message.guild?.preferredLocale || client.config?.defaultLanguage || 'Vietnamese';
    }

    try {
      // Gửi thông báo khởi động lại
      await message.channel.send(
        await GT(message.guild?.id, userLocale, 'success.restart')
      );

      // Log thông tin khởi động lại
      console.log(`Bot đang được khởi động lại bởi ${message.author.tag} (${message.author.id})`);

      // Chờ 2 giây trước khi khởi động lại
      setTimeout(async () => {
        try {
          // Ngắt kết nối với Discord
          client.destroy();

          // Khởi động lại quá trình
          process.exit(0); // Exit với mã 0 để PM2 hoặc các công cụ giám sát khởi động lại
        } catch (error) {
          console.error('Lỗi khi khởi động lại bot:', error);
          message.channel
            .send(
              await GT(message.guild?.id, userLocale, 'error.restart', {
                error: error.message,
              })
            )
            .catch(e => console.error('Không thể gửi thông báo lỗi:', e));
        }
      }, 2000);

      return null; // Không cần trả về gì vì đã gửi tin nhắn trực tiếp
    } catch (error) {
      console.error('Lỗi khi thực thi lệnh restart:', error);
      return {
        content: await GT(message.guild?.id, userLocale, 'error.restart', {
          error: error.message,
        }),
        ephemeral: true,
      };
    }
  },
};
