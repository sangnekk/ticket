const { T, Language } = require('../../../plugins/i18n');
const { EmbedBuilder } = require('discord.js');
const { getGuildLanguage, setGuildLanguage, getGuildPrefix } = require('../../../utils/prisma');

module.exports = {
  name: 'language',
  aliases: ['lang', 'ngonngu'],
  description: 'Xem hoặc thay đổi ngôn ngữ của bot trong server',
  usage: 'language [ngôn_ngữ]',
  examples: ['language', 'language Vietnamese', 'language English'],
  cooldown: 5,
  permissions: {
    bot: ['SendMessages', 'EmbedLinks'],
    user: ['ManageGuild'], // Yêu cầu quyền quản lý server
  },
  async execute(message, args, client) {
    // Lấy ngôn ngữ hiện tại từ database hoặc mặc định từ config
    let currentLocale = await getGuildLanguage(message.guild.id);
    if (!currentLocale) {
      currentLocale = client.config?.defaultLanguage || 'Vietnamese';
    }

    // Lấy prefix từ database
    const currentPrefix = (await getGuildPrefix(message.guild.id)) || '!';

    // Nếu không có tham số, hiển thị ngôn ngữ hiện tại
    if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('🌐 ' + T(currentLocale, 'desc.language'))
        .setDescription(T(currentLocale, 'success.language', { lang: currentLocale }))
        .addFields({
          name: T(currentLocale, 'language.available'),
          value: Object.keys(Language).join(', '),
        })
        .setFooter({
          text: T(currentLocale, 'language.change_guide', { prefix: currentPrefix }),
          iconURL: message.guild.iconURL({ dynamic: true }),
        });

      return {
        embed: embed,
        ephemeral: false,
      };
    }

    // Nếu có tham số, kiểm tra và thay đổi ngôn ngữ
    const newLanguage = args[0];

    // Kiểm tra xem ngôn ngữ có hợp lệ không
    if (!Object.keys(Language).includes(newLanguage)) {
      return {
        content: T(currentLocale, 'error.language', {
          lang: Object.keys(Language).join(', '),
        }),
        ephemeral: true,
      };
    }

    try {
      // Lưu ngôn ngữ mới vào database
      await setGuildLanguage(message.guild.id, newLanguage);

      // Tạo embed thông báo thành công
      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('✅ ' + T(newLanguage, 'success_general'))
        .setDescription(
          T(newLanguage, 'language.changed', {
            old: currentLocale,
            new: newLanguage,
          })
        )
        .setFooter({
          text: message.author.tag,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      return {
        embed: embed,
        ephemeral: false,
      };
    } catch (error) {
      console.error('Lỗi khi thay đổi ngôn ngữ:', error);
      return {
        content: T(currentLocale, 'error.database', { error: error.message }),
        ephemeral: true,
      };
    }
  },
};
