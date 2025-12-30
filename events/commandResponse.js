const { EmbedBuilder, ActionRowBuilder } = require('discord.js');
const { convertEphemeralToFlags } = require('../utils/messageFlags');
const { T } = require('../plugins/i18n');
const { getGuildLanguage, getGuildLogChannelId, getGuildTextOverride } = require('../utils/prisma');
const EmbedUtils = require('../utils/embedUtils');

module.exports = {
  name: 'commandResponse',
  once: false,
  async execute(responseData, client) {
    try {
      const { message, result, error } = responseData;

      // Lấy ngôn ngữ của người dùng từ database
      let userLocale = await getGuildLanguage(message.guild.id);
      if (!userLocale) {
        userLocale =
          message.guild?.preferredLocale || client.config?.defaultLanguage || 'Vietnamese';
      }

      // Tạo log embed cho prefix command
      const logEmbed = new EmbedBuilder()
        .setTitle(`${EmbedUtils.emojis.command} Prefix Command Log`)
        .setColor(error ? EmbedUtils.colors.error : EmbedUtils.colors.success)
        .setThumbnail(message.author.displayAvatarURL())
        .addFields([
          {
            name: `${EmbedUtils.emojis.user} User`,
            value: `**${message.author.tag}**\n\`${message.author.id}\``,
            inline: true,
          },
          {
            name: `${EmbedUtils.emojis.command} Command`,
            value: `\`${message.content}\``,
            inline: true,
          },
          {
            name: `${EmbedUtils.emojis.channel} Channel`,
            value: `**${message.channel.name}**\n\`${message.channel.id}\``,
            inline: true,
          },
          {
            name: `${EmbedUtils.emojis.server} Server`,
            value: `**${message.guild.name}**\n\`${message.guild.id}\``,
            inline: true,
          },
          {
            name: `${EmbedUtils.emojis.time} Time`,
            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: true,
          },
          {
            name: `${EmbedUtils.emojis.gear} Status`,
            value: error ? `${EmbedUtils.emojis.error} Error` : `${EmbedUtils.emojis.success} Success`,
            inline: true,
          },
        ])
        .setFooter({
          text: `Command executed by ${message.author.username}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      // Thêm thông tin lỗi nếu có
      if (error) {
        logEmbed.addFields({
          name: `${EmbedUtils.emojis.error} Error Details`,
          value: `\`\`\`js\n${error.message || 'Unknown error'}\`\`\``,
          inline: false,
        });
      }

      const logChannelId = await getGuildLogChannelId(message.guild?.id);

      // Gửi log
      try {
        if (logChannelId) {
          const logChannel = await client.channels.fetch(logChannelId);
          if (logChannel) {
            await logChannel.send({ embeds: [logEmbed] });
          } else {
            const notFoundKey = 'events.command_response.log_channel_not_found';
            const logMsgKey = 'events.command_response.log_message';

            const notFoundOverride = await getGuildTextOverride(message.guild?.id, notFoundKey);
            const logMsgOverride = await getGuildTextOverride(message.guild?.id, logMsgKey);

            const notFoundText =
              notFoundOverride ||
              T(userLocale, notFoundKey, {
                channel: logChannelId,
              });

            const logMsgText =
              logMsgOverride ||
              T(userLocale, logMsgKey, {
                user: message.author.tag,
                command: message.content,
                guild: message.guild.name,
              });

            console.log(notFoundText);
            console.log(logMsgText);
          }
        } else {
          const logMsgKey = 'events.command_response.log_message';
          const logMsgOverride = await getGuildTextOverride(message.guild?.id, logMsgKey);

          const logMsgText =
            logMsgOverride ||
            T(userLocale, logMsgKey, {
              user: message.author.tag,
              command: message.content,
              guild: message.guild.name,
            });

          console.log(logMsgText);
        }
      } catch (logError) {
        console.error(T(userLocale, 'events.command_response.log_error'), logError);

        const logMsgKey = 'events.command_response.log_message';
        const logMsgOverride = await getGuildTextOverride(message.guild?.id, logMsgKey);

        const logMsgText =
          logMsgOverride ||
          T(userLocale, logMsgKey, {
            user: message.author.tag,
            command: message.content,
            guild: message.guild.name,
          });

        console.log(logMsgText);
      }

      // Nếu có lỗi, xử lý lỗi
      if (error) {
        console.error(T(userLocale, 'events.command_response.error_execute'), error);

        // Tạo error embed
        const errorEmbed = EmbedUtils.error(
          T(userLocale, 'error_general'),
          T(userLocale, 'error.error', {
            error: error.message || T(userLocale, 'use_many.dont_have_data'),
          })
        )
          .setThumbnail(message.author.displayAvatarURL())
          .addFields([
            {
              name: `${EmbedUtils.emojis.gear} Command`,
              value: `\`${message.content}\``,
              inline: true,
            },
            {
              name: `${EmbedUtils.emojis.time} Time`,
              value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
              inline: true,
            },
          ])
          .setFooter({
            text: `Error occurred for ${message.author.username}`,
            iconURL: message.author.displayAvatarURL(),
          });

        return message.channel.send({ embeds: [errorEmbed] }).catch(e => {
          console.error(T(userLocale, 'events.command_response.error_send'), e);
        });
      }

      // Nếu không có kết quả, không làm gì
      if (!result) return;

      // Kiểm tra loại kết quả để xác định cách phản hồi
      if (typeof result === 'string') {
        await message.reply({ content: result });
      } else if (result.embed || result.embeds) {
        let replyOptions = {};

        if (result.embeds) {
          replyOptions.embeds = result.embeds;
        } else if (result.embed) {
          replyOptions.embeds = [result.embed];
        }

        if (result.content) {
          replyOptions.content = result.content;
        }

        if (result.components) {
          replyOptions.components = result.components;
        }

        if (result.files) {
          replyOptions.files = result.files;
        }

        if (result.ephemeral) {
          replyOptions = convertEphemeralToFlags(replyOptions);
        }

        // Nếu có collector, thiết lập
        if (result.collector) {
          const reply = await message.reply(replyOptions);

          const collector = reply.createMessageComponentCollector({
            time: result.collector.time || 60000,
          });

          collector.on('collect', async interaction => {
            if (result.collector.handler) {
              const handlerResult = await result.collector.handler(interaction);
              if (handlerResult) {
                await interaction.update(handlerResult);
              }
            }
          });

          collector.on('end', async (collected, reason) => {
            if (result.collector.end) {
              const endResult = result.collector.end(collected, reason);
              if (endResult) {
                await reply.edit(endResult);
              }
            }
          });
        } else {
          await message.reply(replyOptions);
        }
      } else if (result.content) {
        let replyOptions = { content: result.content };

        if (result.components) {
          replyOptions.components = result.components;
        }

        if (result.files) {
          replyOptions.files = result.files;
        }

        if (result.ephemeral) {
          replyOptions = convertEphemeralToFlags(replyOptions);
        }

        await message.reply(replyOptions);
      } else {
        console.warn(T(userLocale, 'events.command_response.no_valid_data'));
      }
    } catch (responseError) {
      console.error(T('Vietnamese', 'events.command_response.error_process'), responseError);
      try {
        let userLocale = 'Vietnamese';
        try {
          userLocale =
            (await getGuildLanguage(responseData.message.guild.id)) ||
            responseData.message.guild?.preferredLocale ||
            'Vietnamese';
        } catch (e) {}
        await responseData.message.channel.send(T(userLocale, 'error.error'));
      } catch (e) {
        console.error(T('Vietnamese', 'events.command_response.error_send'), e);
      }
    }
  },
};
