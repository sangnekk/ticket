const { Events } = require('discord.js');
const { MessageFlags } = require('discord-api-types/v10');
const { getActiveGuildBan, getGuildLanguage } = require('../utils/prisma');
const { GT } = require('../utils/guildI18n');
const { notifyUser, getErrorMessage } = require('../utils/errorHandler');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    try {

      if (!interaction.guild) return;

      const locale =
        (await getGuildLanguage(interaction.guild.id)) ||
        interaction.client.config?.defaultLanguage ||
        'Vietnamese';

      const banInfo = await getActiveGuildBan(interaction.guild.id);
      if (banInfo) {
        const banText = await GT(interaction.guild.id, locale, 'server_manage.banned_notice', {
          reason: banInfo.reason,
        });
        if (interaction.isRepliable()) {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
              content: banText,
            });
          } else {
            await interaction.reply({ content: banText, flags: MessageFlags.Ephemeral });
          }
        }
        return;
      }

      // Chỉ xử lý slash commands
      if (interaction.isChatInputCommand()) {
        const command = client.slashCommands.get(interaction.commandName);

        if (!command) {
          console.warn(`Không tìm thấy slash command: ${interaction.commandName}`);
          return;
        }

        try {
          const result = await command.execute(interaction, client);

          // Emit event sau khi thực thi command thành công
          client.emit(
            'slashCommandResponse',
            {
              interaction,
              result,
              error: null,
            },
            client
          );
        } catch (error) {
          console.error(`Lỗi khi xử lý slash command ${interaction.commandName}:`, error);

          // Emit event với lỗi
          client.emit(
            'slashCommandResponse',
            {
              interaction,
              result: null,
              error,
            },
            client
          );

          // Xử lý lỗi với error handler
          const errorMessage = getErrorMessage(error, {
            action: `thực hiện lệnh /${interaction.commandName}`,
          });

          try {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({
                content: errorMessage,
                flags: MessageFlags.Ephemeral,
              });
            } else if (interaction.deferred) {
              await interaction.editReply({
                content: errorMessage,
              });
            } else {
              // Nếu đã reply, thử gửi followUp
              await interaction.followUp({
                content: errorMessage,
                flags: MessageFlags.Ephemeral,
              }).catch(() => {
                // Nếu followUp thất bại, thử gửi DM
                notifyUser({
                  error,
                  user: interaction.user,
                  source: interaction,
                  context: { action: `thực hiện lệnh /${interaction.commandName}` },
                }).catch(() => {});
              });
            }
          } catch (notifyError) {
            // Chỉ log nếu không phải lỗi Unknown interaction
            if (notifyError.code !== 10062) {
              console.error('Không thể thông báo lỗi cho người dùng:', notifyError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Lỗi trong interactionCreate handler:', error);
    }
  },
};
