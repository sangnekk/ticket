const { Events, Collection, PermissionsBitField } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { T } = require('../plugins/i18n');
const { GT } = require('../utils/guildI18n');
const { getGuildLanguage, getGuildPrefix, getActiveGuildBan } = require('../utils/prisma');
const { notifyUser, getErrorMessage } = require('../utils/errorHandler');

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message, client) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Lấy ngôn ngữ từ database
    let userLocale = await getGuildLanguage(message.guild.id);
    if (!userLocale) {
      userLocale = message.guild?.preferredLocale || client.config?.defaultLanguage || 'Vietnamese';
    }

    const banInfo = await getActiveGuildBan(message.guild.id);
    if (banInfo) {
      const banText = await GT(message.guild.id, userLocale, 'server_manage.banned_notice', {
        reason: banInfo.reason,
      });
      await message.reply(banText).catch(() => {});
      return;
    }

    // Lấy prefix từ database cho guild này
    let guildPrefix = await getGuildPrefix(message.guild.id);
    if (!guildPrefix) {
      // Nếu không có prefix trong database, sử dụng prefix mặc định
      guildPrefix = '!';
    }

    // Kiểm tra prefix với hỗ trợ chữ hoa/chữ thường cho prefix chữ cái
    let usedPrefix = null;
    let actualPrefix = null;

    if (/^[a-zA-Z]/.test(guildPrefix)) {
      // Prefix là chữ cái - hỗ trợ cả chữ hoa và chữ thường
      const prefixRegex = new RegExp(`^${guildPrefix}`, 'i');
      if (prefixRegex.test(message.content)) {
        usedPrefix = guildPrefix;
        actualPrefix = message.content.match(prefixRegex)[0];
      }
    } else {
      // Prefix là ký tự đặc biệt - kiểm tra chính xác
      if (message.content.startsWith(guildPrefix)) {
        usedPrefix = guildPrefix;
        actualPrefix = guildPrefix;
      }
    }

    // Nếu không tìm thấy prefix hợp lệ, return
    if (!usedPrefix) return;

    // Extract arguments
    const args = message.content.slice(actualPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Find the command (check both direct commands and aliases)
    const command =
      client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));

    // If no command found, return
    if (!command) return;

    // BƯỚC 1: Kiểm tra xem lệnh có bị vô hiệu hóa không
    try {
      // Xác định đường dẫn tương đối của lệnh để kiểm tra key
      let commandKey = null;

      // Tìm thư mục chứa lệnh
      const commandPaths = [];
      const searchCommandPath = dirPath => {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = fs.lstatSync(itemPath);

          if (stats.isDirectory()) {
            searchCommandPath(itemPath);
          } else if (item.endsWith('.js')) {
            try {
              const cmdModule = require(itemPath);
              if (cmdModule.name === command.name) {
                const folderName = path.dirname(itemPath).split(path.sep).pop();
                commandPaths.push(`${folderName}/${command.name}`.toLowerCase());
              }
            } catch (error) {
              // Bỏ qua lỗi
            }
          }
        }
      };

      const prefixCommandsPath = path.join(process.cwd(), 'commands', 'prefix');
      searchCommandPath(prefixCommandsPath);

      if (commandPaths.length > 0) {
        commandKey = commandPaths[0];
      } else {
        commandKey = command.name.toLowerCase(); // Fallback
      }

      // Kiểm tra xem lệnh có bị vô hiệu hóa không
          if (client.disabledCommands && client.disabledCommands.has(commandKey)) {
            const content = await GT(message.guild?.id, userLocale, 'error.command_disabled', {
              command: command.name,
            });
            return client.emit('commandResponse', {
              message,
              result: {
                content,
                ephemeral: true,
              },
            });
          }

      // Kiểm tra thư mục chứa lệnh có bị vô hiệu hóa không
      if (client.disabledCommands) {
        const folderName = commandKey.split('/')[0];
        let isDisabled = false;

        client.disabledCommands.forEach(disabledKey => {
          if (commandKey.startsWith(`${disabledKey}/`)) {
            isDisabled = true;
          }
        });

        if (isDisabled) {
          const content = await GT(message.guild?.id, userLocale, 'error.folder_disabled');
          return client.emit('commandResponse', {
            message,
            result: { content, ephemeral: true },
          });
        }
      }
    } catch (error) {
      console.error(
        await GT(message.guild?.id, userLocale, 'error.check_disabled_status', { error })
      );
    }

    // BƯỚC 2: Kiểm tra quyền hạn
    if (command.permissions) {
      const requiredPermissions = command.permissions;
      const missingPermissions = [];

      // Kiểm tra quyền của bot
      if (requiredPermissions.bot) {
        const botPerms = message.guild.members.me.permissions;
        const missingBotPerms = botPerms.missing(requiredPermissions.bot);

          if (missingBotPerms.length > 0) {
            const content = await GT(
              message.guild?.id,
              userLocale,
              'handler.bot_no_permission',
              {
                permissions: missingBotPerms.join(', '),
              }
            );
            return client.emit('commandResponse', {
              message,
              result: {
                content,
              },
            });
          }
      }

      // Kiểm tra quyền của người dùng
      if (requiredPermissions.user) {
        // Nếu lệnh chỉ dành cho người tạo bot
        if (requiredPermissions.user === 'DEV') {
          const DevID = client.config?.DevID;

          // Kiểm tra id owner
          if (message.author.id !== DevID) {
            const content = await GT(message.guild?.id, userLocale, 'handler.dev_only');
            return client.emit('commandResponse', {
              message,
              result: {
                content,
              },
            });
          }
        }
        // Kiểm tra quyền discord thông thường
        else {
          const memberPerms = message.member.permissions;
          const missingUserPerms = memberPerms.missing(requiredPermissions.user);

          if (missingUserPerms.length > 0) {
            const content = await GT(message.guild?.id, userLocale, 'handler.no_permission', {
              permissions: missingUserPerms.join(', '),
            });
            return client.emit('commandResponse', {
              message,
              result: {
                content,
              },
            });
          }
        }
      }
    }

    // BƯỚC 3: Kiểm tra cooldown
    if (command.cooldown) {
      if (!client.cooldowns) {
        client.cooldowns = new Collection();
      }

      if (!client.cooldowns.has(command.name)) {
        client.cooldowns.set(command.name, new Collection());
      }

      const now = Date.now();
      const timestamps = client.cooldowns.get(command.name);
      const cooldownAmount = (command.cooldown || 3) * 1000;

      if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          const content = await GT(message.guild?.id, userLocale, 'handler.cooldown', {
            time: timeLeft.toFixed(1),
            command: command.name,
          });
          return client.emit('commandResponse', {
            message,
            result: {
              content,
            },
          });
        }
      }

      timestamps.set(message.author.id, now);
      setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }

    // Thực thi lệnh và xử lý kết quả thông qua event
    try {
      // Thực thi lệnh và lấy kết quả trả về (nếu có)
      const result = await command.execute(message, args, client);

      // Emit event để xử lý phản hồi
      client.emit('commandResponse', { message, result });
    } catch (error) {
      console.error(
        await GT(message.guild?.id, userLocale, 'error.command_execution', { error })
      );
      
      // Xử lý lỗi với error handler
      const errorMessage = getErrorMessage(error, {
        action: `thực hiện lệnh ${guildPrefix}${commandName}`,
      });
      
      try {
        await message.reply({
          content: errorMessage,
        });
      } catch (replyError) {
        // Nếu không reply được, thử gửi DM
        await notifyUser({
          error,
          user: message.author,
          source: message,
          context: { action: `thực hiện lệnh ${guildPrefix}${commandName}` },
        });
      }
      
      client.emit('commandResponse', { message, error });
    }
  },
};
