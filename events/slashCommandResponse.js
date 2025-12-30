const { EmbedBuilder, MessageFlags } = require('discord.js');
const { T } = require('../plugins/i18n');
const { getGuildLanguage, getGuildTextOverride } = require('../utils/prisma');
const EmbedUtils = require('../utils/embedUtils');
const config = require('../config.json');
const { notifyUser, getErrorMessage } = require('../utils/errorHandler');

const GLOBAL_LOG_CHANNEL_ID =
  config.logChannelId ||
  config.guildLogChannelId ||
  config.guildLogChannels?.default ||
  Object.values(config.guildLogChannels || {})[0] ||
  null;
const LOG_THEME = {
  colors: {
    success: 0x2ecc71,
    error: 0xe74c3c,
    info: 0x3498db,
  },
  emojis: {
    command: '📝',
    user: '👤',
    channel: '📍',
    server: '🏠',
    time: '⏰',
    gear: '⚙️',
    success: '✅',
    error: '❌',
  },
};

module.exports = {
  name: 'slashCommandResponse',
  once: false,
  async execute(responseData, client) {
    try {
      const { interaction, result, error } = responseData;

      // Lấy ngôn ngữ của người dùng từ database
      let userLocale = await getGuildLanguage(interaction.guild.id);
      if (!userLocale) {
        userLocale =
          interaction.guild?.preferredLocale || client.config?.defaultLanguage || 'Vietnamese';
      }

      // Tạo log embed cho slash command
      const logEmbed = new EmbedBuilder()
        .setTitle(`${LOG_THEME.emojis.command} Slash Command Log`)
        .setColor(error ? LOG_THEME.colors.error : LOG_THEME.colors.success)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields([
          {
            name: `${LOG_THEME.emojis.user} User`,
            value: `**${interaction.user.tag}**\n\`${interaction.user.id}\``,
            inline: true,
          },
          {
            name: `${LOG_THEME.emojis.command} Command`,
            value: `\`/${interaction.commandName}\``,
            inline: true,
          },
          {
            name: `${LOG_THEME.emojis.channel} Channel`,
            value: `**${interaction.channel.name}**\n\`${interaction.channel.id}\``,
            inline: true,
          },
          {
            name: `${LOG_THEME.emojis.server} Server`,
            value: `**${interaction.guild.name}**\n\`${interaction.guild.id}\``,
            inline: true,
          },
          {
            name: `${LOG_THEME.emojis.time} Time`,
            value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
            inline: true,
          },
          {
            name: `${LOG_THEME.emojis.gear} Status`,
            value: error
              ? `${LOG_THEME.emojis.error} Error`
              : `${LOG_THEME.emojis.success} Success`,
            inline: true,
          },
        ])
        .setFooter({
          text: `Slash command executed by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      // Thêm options cho slash command nếu có
      if (interaction.options?.data && interaction.options.data.length > 0) {
        const optionsText = interaction.options.data
          .map(option => {
            if (option.type === 1) {
              // SUB_COMMAND
              return `**${option.name}**`;
            } else if (option.type === 2) {
              // SUB_COMMAND_GROUP
              return `**${option.name}** (group)`;
            } else {
              return `**${option.name}**: ${option.value}`;
            }
          })
          .join('\n');

        logEmbed.addFields({
          name: `${LOG_THEME.emojis.gear} Options`,
          value: optionsText || 'None',
          inline: false,
        });
      }

      // Thêm thông tin lỗi nếu có
      if (error) {
        logEmbed.addFields({
          name: `${LOG_THEME.emojis.error} Error Details`,
          value: `\`\`\`js\n${error.message || 'Unknown error'}\`\`\``,
          inline: false,
        });
      }

      const logChannelId = GLOBAL_LOG_CHANNEL_ID;

      // Gửi log
      try {
        if (logChannelId) {
          const logChannel = await client.channels.fetch(logChannelId);
          if (logChannel) {
            await logChannel.send({ embeds: [logEmbed] });
          } else {
            const notFoundKey = 'events.slash_response.log_channel_not_found';
            const logMsgKey = 'events.slash_response.log_message';

            const notFoundOverride = await getGuildTextOverride(
              interaction.guild?.id,
              notFoundKey
            );
            const logMsgOverride = await getGuildTextOverride(interaction.guild?.id, logMsgKey);

            const notFoundText =
              notFoundOverride ||
              T(userLocale, notFoundKey, {
                channel: logChannelId,
              });

            const logMsgText =
              logMsgOverride ||
              T(userLocale, logMsgKey, {
                user: interaction.user.tag,
                command: interaction.commandName,
                guild: interaction.guild.name,
              });

            console.log(notFoundText);
            console.log(logMsgText);
          }
        } else {
          const logMsgKey = 'events.slash_response.log_message';
          const logMsgOverride = await getGuildTextOverride(interaction.guild?.id, logMsgKey);

          const logMsgText =
            logMsgOverride ||
            T(userLocale, logMsgKey, {
              user: interaction.user.tag,
              command: interaction.commandName,
              guild: interaction.guild.name,
            });

          console.log(logMsgText);
        }
      } catch (logError) {
        console.error(T(userLocale, 'events.slash_response.log_error'), logError);
        
        // Xử lý lỗi khi gửi log
        const logErrorMessage = getErrorMessage(logError, {
          channel: logChannelId ? `<#${logChannelId}>` : null,
          action: 'gửi log',
        });
        
        // Thông báo cho người dùng nếu lỗi nghiêm trọng
        if (logError.code === 50001 || logError.code === 50013) {
          await notifyUser({
            error: logError,
            user: interaction.user,
            source: interaction,
            context: { 
              channel: logChannelId ? `<#${logChannelId}>` : null,
              action: 'ghi log lệnh',
            },
          });
        }

        const logMsgKey = 'events.slash_response.log_message';
        const logMsgOverride = await getGuildTextOverride(interaction.guild?.id, logMsgKey);

        const logMsgText =
          logMsgOverride ||
          T(userLocale, logMsgKey, {
            user: interaction.user.tag,
            command: interaction.commandName,
            guild: interaction.guild.name,
          });

        console.log(logMsgText);
      }

      // Nếu có lỗi, xử lý lỗi
      if (error) {
        console.error(T(userLocale, 'events.slash_response.error_execute'), error);

        const errorEmbed = new EmbedBuilder()
          .setColor(LOG_THEME.colors.error)
          .setTitle(`${LOG_THEME.emojis.error} ${T(userLocale, 'error_general')}`)
          .setDescription(
            T(userLocale, 'error.error', {
              error: error.message || T(userLocale, 'use_many.dont_have_data'),
            })
          )
          .setThumbnail(interaction.user.displayAvatarURL())
          .addFields(
            {
              name: `${LOG_THEME.emojis.gear} Command`,
              value: `\`/${interaction.commandName}\``,
              inline: true,
            },
            {
              name: `${LOG_THEME.emojis.time} Time`,
              value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
              inline: true,
            }
          )
          .setFooter({
            text: `Error occurred for ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL(),
          });

        if (!interaction.replied && !interaction.deferred) {
          return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral }).catch(e => {
            console.error(T(userLocale, 'events.slash_response.error_send'), e);
          });
        } else if (interaction.deferred) {
          return interaction.editReply({ embeds: [errorEmbed] }).catch(e => {
            console.error(T(userLocale, 'events.slash_response.error_send'), e);
          });
        }
      }

      // Nếu không có kết quả, không làm gì
      if (!result) return;

      // Kiểm tra loại kết quả để xác định cách phản hồi
      if (typeof result === 'string') {
        const infoEmbed = EmbedUtils.create({
          description: result,
          color: EmbedUtils.colors.info,
        });
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ embeds: [infoEmbed] });
        } else if (interaction.deferred) {
          await interaction.editReply({ embeds: [infoEmbed] });
        }
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
          replyOptions.flags = MessageFlags.Ephemeral;
        }

        // Nếu có collector, thiết lập
        if (result.collector) {
          let reply;
          if (!interaction.replied && !interaction.deferred) {
            reply = await interaction.reply(replyOptions);
          } else if (interaction.deferred) {
            reply = await interaction.editReply(replyOptions);
          }

          if (reply) {
            const collector = reply.createMessageComponentCollector({
              time: result.collector.time || 60000,
            });

            collector.on('collect', async collectInteraction => {
              if (result.collector.handler) {
                const handlerResult = await result.collector.handler(collectInteraction);
                if (handlerResult) {
                  await collectInteraction.update(handlerResult);
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
          }
        } else {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply(replyOptions);
          } else if (interaction.deferred) {
            await interaction.editReply(replyOptions);
          }
        }
      } else if (result.content) {
        const contentEmbed = EmbedUtils.create({
          description: result.content,
          color: EmbedUtils.colors.primary,
        });
        let replyOptions = { embeds: [contentEmbed] };

        if (result.components) {
          replyOptions.components = result.components;
        }

        if (result.files) {
          replyOptions.files = result.files;
        }

        if (result.ephemeral) {
          replyOptions.flags = MessageFlags.Ephemeral;
        }

        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply(replyOptions);
        } else if (interaction.deferred) {
          await interaction.editReply(replyOptions);
        }
      } else {
        console.warn(T(userLocale, 'events.slash_response.no_valid_data'));
      }
    } catch (responseError) {
      console.error(T('Vietnamese', 'events.slash_response.error_process'), responseError);
      try {
        let userLocale = 'Vietnamese';
        try {
          userLocale =
            (await getGuildLanguage(responseData.interaction.guild.id)) ||
            responseData.interaction.guild?.preferredLocale ||
            'Vietnamese';
        } catch (e) {}

        const fallbackEmbed = EmbedUtils.error(
          T(userLocale, 'error_general'),
          T(userLocale, 'error.error')
        );

        if (!responseData.interaction.replied && !responseData.interaction.deferred) {
          await responseData.interaction.reply({
            embeds: [fallbackEmbed],
            flags: MessageFlags.Ephemeral,
          });
        } else if (responseData.interaction.deferred) {
          await responseData.interaction.editReply({ embeds: [fallbackEmbed] });
        }
      } catch (e) {
        console.error(T('Vietnamese', 'events.slash_response.error_send'), e);
      }
    }
  },
};
