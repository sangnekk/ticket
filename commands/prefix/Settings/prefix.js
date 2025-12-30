const { EmbedBuilder } = require('discord.js');
const { T } = require('../../../plugins/i18n');
const { GT } = require('../../../utils/guildI18n');
const { getGuildPrefix, setGuildPrefix, getGuildLanguage } = require('../../../utils/prisma');
const EmbedUtils = require('../../../utils/embedUtils');

module.exports = {
  name: 'prefix',
  description: 'Xem hoặc thay đổi prefix của server',
  aliases: ['setprefix'],
  usage: '[prefix mới]',
  examples: ['prefix !', 'prefix ?', 'prefix'],
  cooldown: 5,
  permissions: {
    bot: ['SendMessages', 'EmbedLinks'],
    user: ['ManageGuild'], // Yêu cầu quyền quản lý server
  },

  async execute(message, args, client) {
    // Lấy ngôn ngữ của người dùng từ database
    let userLocale = await getGuildLanguage(message.guild.id);
    if (!userLocale) {
      userLocale = message.guild?.preferredLocale || client.config?.defaultLanguage || 'Vietnamese';
    }

    try {
      // Nếu không có args, hiển thị prefix hiện tại
      if (args.length === 0) {
        const currentPrefix = (await getGuildPrefix(message.guild.id)) || '!';

        const embed = EmbedUtils.info(
          await GT(message.guild?.id, userLocale, 'prefix.title'),
          `${await GT(message.guild?.id, userLocale, 'prefix.current', {
            prefix: currentPrefix,
          })}\n\n${await GT(message.guild?.id, userLocale, 'prefix.change_guide', {
            prefix: currentPrefix,
          })}`,
          {
            fields: [
              {
                name: await GT(message.guild?.id, userLocale, 'prefix.examples'),
                value: await GT(message.guild?.id, userLocale, 'prefix.examples_list', {
                  prefix: currentPrefix,
                }),
                inline: false,
              },
            ],
          }
        );

        return {
          embed: embed,
        };
      }

      // Kiểm tra quyền quản lý server
      if (!message.member.permissions.has('ManageGuild')) {
        const embed = EmbedUtils.error(
          await GT(message.guild?.id, userLocale, 'prefix.no_permission'),
          await GT(message.guild?.id, userLocale, 'prefix.no_permission_desc')
        );

        return {
          embed: embed,
          ephemeral: true,
        };
      }

      const newPrefix = args[0];

      // Kiểm tra prefix hợp lệ
      if (newPrefix.length > 10) {
        const embed = EmbedUtils.error(
          await GT(message.guild?.id, userLocale, 'prefix.invalid_length'),
          await GT(message.guild?.id, userLocale, 'prefix.invalid_length_desc')
        );

        return {
          embed: embed,
        };
      }

      // Kiểm tra prefix có chứa ký tự đặc biệt không hợp lệ
      if (newPrefix.includes(' ') || newPrefix.includes('\n') || newPrefix.includes('\t')) {
        const embed = EmbedUtils.error(
          await GT(message.guild?.id, userLocale, 'prefix.invalid_chars'),
          await GT(message.guild?.id, userLocale, 'prefix.invalid_chars_desc')
        );

        return {
          embed: embed,
        };
      }

      // Lưu prefix cũ để hiển thị trong message
      const oldPrefix = (await getGuildPrefix(message.guild.id)) || '!';

      // Cập nhật prefix trong database
      await setGuildPrefix(message.guild.id, newPrefix);

      const embed = EmbedUtils.success(
        await GT(message.guild?.id, userLocale, 'prefix.updated'),
        await GT(message.guild?.id, userLocale, 'prefix.updated_desc', {
          oldPrefix: oldPrefix,
          newPrefix: newPrefix,
        }),
        {
          fields: [
            {
              name: await GT(message.guild?.id, userLocale, 'prefix.note'),
              value: await GT(message.guild?.id, userLocale, 'prefix.note_desc'),
              inline: false,
            },
          ],
        }
      );

      return {
        embed: embed,
      };
    } catch (error) {
      console.error('Lỗi khi xử lý lệnh prefix:', error);

      const embed = EmbedUtils.error(
        await GT(message.guild?.id, userLocale, 'prefix.error'),
        await GT(message.guild?.id, userLocale, 'prefix.error_desc')
      );

      return {
        embed: embed,
      };
    }
  },
};
