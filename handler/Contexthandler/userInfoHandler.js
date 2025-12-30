module.exports = {
  // Sử dụng "user_info_*" để xử lý tất cả các context menu command bắt đầu bằng "user_info_"
  customId: 'user_info_*',
  async execute(interaction, client, options = {}) {
    const { selectedValue } = options;

    // Lấy thông tin loại từ customId
    const infoType =
      selectedValue ||
      interaction.customId?.split('_')[2] ||
      interaction.commandName?.split('_')[2] ||
      'basic';

    // Xác định đối tượng mục tiêu (người dùng hoặc tin nhắn)
    if (interaction.targetType === 'USER') {
      const targetUser = interaction.targetUser;

      // Chuẩn bị thông tin người dùng dựa trên loại
      let userInfo = '';

      switch (infoType) {
        case 'roles':
          if (interaction.guild) {
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            if (member) {
              const roles = member.roles.cache
                .filter(role => role.id !== interaction.guild.id) // Bỏ qua vai trò @everyone
                .map(role => role.name)
                .join(', ');
              userInfo = `Các vai trò: ${roles || 'Không có vai trò'}`;
            } else {
              userInfo = 'Không thể lấy thông tin vai trò của người dùng.';
            }
          } else {
            userInfo = 'Lệnh này chỉ hoạt động trong máy chủ.';
          }
          break;

        case 'avatar':
          userInfo = `Link avatar: ${targetUser.displayAvatarURL({ dynamic: true, size: 4096 })}`;
          break;

        case 'id':
          userInfo = `ID: ${targetUser.id}`;
          break;

        case 'created':
          const createdAt = targetUser.createdAt;
          const createdTimestamp = Math.floor(createdAt.getTime() / 1000);
          userInfo = `Tài khoản được tạo: <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`;
          break;

        case 'basic':
        default:
          userInfo = `Tag: ${targetUser.tag}\nID: ${targetUser.id}\nBot: ${targetUser.bot ? 'Có' : 'Không'}`;
          break;
      }

      // Phản hồi với thông tin
      await interaction.reply({
        content: `**Thông tin người dùng ${targetUser.username}:**\n${userInfo}`,
        ephemeral: true,
      });
    } else if (interaction.targetType === 'MESSAGE') {
      const targetMessage = interaction.targetMessage;

      // Xử lý tin nhắn dựa trên infoType
      let messageInfo = '';

      switch (infoType) {
        case 'stats':
          messageInfo = `
                        ID tin nhắn: ${targetMessage.id}
                        Độ dài: ${targetMessage.content.length} ký tự
                        Attachments: ${targetMessage.attachments.size}
                        Embeds: ${targetMessage.embeds.length}
                        Reactions: ${targetMessage.reactions.cache.size}
                    `;
          break;

        case 'author':
          messageInfo = `
                        Tác giả: ${targetMessage.author.tag}
                        ID: ${targetMessage.author.id}
                        Bot: ${targetMessage.author.bot ? 'Có' : 'Không'}
                    `;
          break;

        default:
          messageInfo = `
                        ID: ${targetMessage.id}
                        Tác giả: ${targetMessage.author.tag}
                        Được gửi lúc: <t:${Math.floor(targetMessage.createdTimestamp / 1000)}:F>
                    `;
          break;
      }

      await interaction.reply({
        content: `**Thông tin tin nhắn:**\n${messageInfo}`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'Loại context menu không được hỗ trợ.',
        ephemeral: true,
      });
    }

    // Log thông tin
    console.log(
      `Người dùng ${interaction.user.tag} đã sử dụng context command ${infoType} trên ${interaction.targetType}`
    );
  },
};
