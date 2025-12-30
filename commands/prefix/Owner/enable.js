const fs = require('fs');
const path = require('path');
const EmbedUtils = require('../../../utils/embedUtils');
const { disabledCommandsService } = require('../../../utils/dbService');

module.exports = {
  name: 'enable',
  description: 'Kích hoạt lại một lệnh hoặc thư mục lệnh đã bị vô hiệu hóa',
  aliases: ['on'],
  usage: '<tên_lệnh/thư_mục/all>',
  permissions: {
    bot: ['SendMessages', 'EmbedLinks'],
    user: ['Administrator'], // Chỉ admin server và dev mới được sử dụng
  },

  async execute(message, args, client) {
    if (!args.length) {
      // Hiển thị danh sách lệnh bị vô hiệu hóa trong channel hiện tại
      const guildId = message.guild?.id || null;
      const channelId = message.channel.id;

      const disabledCommands = await disabledCommandsService.getDisabledInChannel(
        guildId,
        channelId
      );
      if (disabledCommands.length === 0) {
        return { content: 'Không có lệnh nào đang bị vô hiệu hóa trong channel này.' };
      }

      const disabledList = disabledCommands
        .map(cmd => {
          let scope = 'toàn cục';
          if (cmd.guildId && cmd.channelId) {
            scope = `channel ${cmd.channelId}`;
          } else if (cmd.guildId) {
            scope = `guild ${cmd.guildId}`;
          }
          return `\`${cmd.commandId}\` (${scope})`;
        })
        .join('\n');

      const embed = EmbedUtils.info('Danh sách lệnh bị vô hiệu hóa', disabledList, {
        timestamp: true,
      });

      return { embeds: [embed] };
    }

    const targetName = args[0].toLowerCase();

    // Tự động nhận diện guild và channel hiện tại
    const guildId = message.guild?.id || null;
    const channelId = message.channel.id;
    const scopeText = message.guild ? `channel #${message.channel.name}` : 'DM';

    // Trường hợp đặc biệt: kích hoạt tất cả
    if (targetName === 'all') {
      const prefixCommandsPath = path.join(process.cwd(), 'commands', 'prefix');
      const allCommands = [];

      const getAllCommands = (dirPath, relativePath = '') => {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = fs.lstatSync(itemPath);

          if (stats.isDirectory()) {
            getAllCommands(itemPath, path.join(relativePath, item));
          } else if (item.endsWith('.js')) {
            try {
              const cmdModule = require(itemPath);
              if (cmdModule.name) {
                const folderName = path.dirname(itemPath).split(path.sep).pop();
                allCommands.push(`${folderName}/${cmdModule.name}`.toLowerCase());
              }
            } catch (error) {
              console.error(`Lỗi khi tải lệnh ${itemPath}:`, error);
            }
          }
        }
      };

      getAllCommands(prefixCommandsPath);

      // Xóa tất cả lệnh khỏi database
      let successCount = 0;
      for (const cmd of allCommands) {
        const success = await disabledCommandsService.remove(cmd, guildId, channelId);
        if (success) successCount++;
      }

      const embed = EmbedUtils.success(
        'Kích hoạt tất cả lệnh',
        `Đã kích hoạt **${successCount}** lệnh trong ${scopeText}.`,
        { timestamp: true }
      );

      return { embeds: [embed] };
    }

    // Trường hợp kích hoạt thư mục
    const prefixCommandsPath = path.join(process.cwd(), 'commands', 'prefix');
    const folderPath = path.join(prefixCommandsPath, targetName);

    if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
      const folderCommands = [];

      const getFolderCommands = dirPath => {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = fs.lstatSync(itemPath);

          if (stats.isDirectory()) {
            getFolderCommands(itemPath);
          } else if (item.endsWith('.js')) {
            try {
              const cmdModule = require(itemPath);
              if (cmdModule.name) {
                const folderName = path.dirname(itemPath).split(path.sep).pop();
                folderCommands.push(`${folderName}/${cmdModule.name}`.toLowerCase());
              }
            } catch (error) {
              console.error(`Lỗi khi tải lệnh ${itemPath}:`, error);
            }
          }
        }
      };

      getFolderCommands(folderPath);

      // Xóa tất cả lệnh trong thư mục khỏi database
      let successCount = 0;
      for (const cmd of folderCommands) {
        const success = await disabledCommandsService.remove(cmd, guildId, channelId);
        if (success) successCount++;
      }

      const embed = EmbedUtils.success(
        'Kích hoạt thư mục lệnh',
        `Đã kích hoạt **${successCount}** lệnh trong thư mục \`${targetName}\` cho ${scopeText}.`,
        { timestamp: true }
      );

      return { embeds: [embed] };
    }

    // Trường hợp kích hoạt lệnh cụ thể
    const command =
      client.commands.get(targetName) || client.commands.get(client.aliases.get(targetName));

    if (!command) {
      return { content: `Không tìm thấy lệnh \`${targetName}\`.` };
    }

    // Tìm đường dẫn của lệnh prefix
    let commandKey = null;
    const searchCommand = (dirPath, relativePath = '') => {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.lstatSync(itemPath);

        if (stats.isDirectory()) {
          searchCommand(itemPath, path.join(relativePath, item));
        } else if (item.endsWith('.js')) {
          try {
            const cmdModule = require(itemPath);
            if (cmdModule.name === command.name) {
              const folderName = path.dirname(itemPath).split(path.sep).pop();
              commandKey = `${folderName}/${command.name}`.toLowerCase();
              return true;
            }
          } catch (error) {
            console.error(`Lỗi khi tải lệnh ${itemPath}:`, error);
          }
        }
      }
      return false;
    };

    searchCommand(prefixCommandsPath);

    if (!commandKey) {
      commandKey = command.name.toLowerCase(); // Fallback nếu không tìm thấy path
    }

    // Tìm slash command tương ứng
    let slashCommandKey = null;
    const slashCommandsPath = path.join(process.cwd(), 'commands', 'slash');

    const searchSlashCommand = dirPath => {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.lstatSync(itemPath);

        if (stats.isDirectory()) {
          searchSlashCommand(itemPath);
        } else if (item.endsWith('.js')) {
          try {
            const cmdModule = require(itemPath);
            if (cmdModule.data && cmdModule.data.name === command.name) {
              const folderName = path.dirname(itemPath).split(path.sep).pop();
              slashCommandKey = `${folderName}/${cmdModule.data.name}`.toLowerCase();
              return true;
            }
          } catch (error) {
            console.error(`Lỗi khi tải slash command ${itemPath}:`, error);
          }
        }
      }
      return false;
    };

    searchSlashCommand(slashCommandsPath);

    if (!slashCommandKey) {
      slashCommandKey = command.name.toLowerCase(); // Fallback
    }

    // Kiểm tra xem lệnh có bị disable không
    const isPrefixDisabled = await disabledCommandsService.isDisabled(
      commandKey,
      guildId,
      channelId
    );
    const isSlashDisabled = await disabledCommandsService.isDisabled(
      slashCommandKey,
      guildId,
      channelId
    );

    if (!isPrefixDisabled && !isSlashDisabled) {
      return { content: `Lệnh \`${command.name}\` không bị vô hiệu hóa trong ${scopeText}.` };
    }

    // Xóa khỏi database
    let successCount = 0;

    if (isPrefixDisabled) {
      const prefixSuccess = await disabledCommandsService.remove(commandKey, guildId, channelId);
      if (prefixSuccess) successCount++;
    }

    if (isSlashDisabled) {
      const slashSuccess = await disabledCommandsService.remove(
        slashCommandKey,
        guildId,
        channelId
      );
      if (slashSuccess) successCount++;
    }

    if (successCount > 0) {
      const embed = EmbedUtils.success(
        'Kích hoạt lệnh',
        `Đã kích hoạt lệnh \`${command.name}\` (prefix + slash) trong ${scopeText}.`,
        { timestamp: true }
      );

      return { embeds: [embed] };
    } else {
      return { content: 'Có lỗi xảy ra khi kích hoạt lệnh.' };
    }
  },
};
