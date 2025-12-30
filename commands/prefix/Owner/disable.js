const fs = require('fs');
const path = require('path');
const EmbedUtils = require('../../../utils/embedUtils');
const { disabledCommandsService } = require('../../../utils/dbService');

module.exports = {
  name: 'disable',
  description: 'Vô hiệu hóa một lệnh hoặc thư mục lệnh',
  aliases: ['off'],
  usage: '<tên_lệnh/thư_mục/all>',
  permissions: {
    bot: ['SendMessages', 'EmbedLinks'],
    user: ['Administrator'], // Chỉ admin server và dev mới được sử dụng
  },

  async execute(message, args, client) {
    if (!args.length) {
      return {
        content:
          'Bạn cần cung cấp tên lệnh hoặc thư mục để vô hiệu hóa, hoặc sử dụng "all" để vô hiệu hóa tất cả.',
      };
    }

    const targetName = args[0].toLowerCase();

    // Tự động nhận diện guild và channel hiện tại
    const guildId = message.guild?.id || null;
    const channelId = message.channel.id;
    const scopeText = message.guild ? `channel #${message.channel.name}` : 'DM';

    // Trường hợp đặc biệt: vô hiệu hóa tất cả
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

      // Thêm tất cả lệnh vào database
      let successCount = 0;
      for (const cmd of allCommands) {
        const success = await disabledCommandsService.add(cmd, guildId, channelId);
        if (success) successCount++;
      }

      const embed = EmbedUtils.error(
        'Vô hiệu hóa tất cả lệnh',
        `Đã vô hiệu hóa **${successCount}** lệnh trong ${scopeText}.`,
        { timestamp: true }
      );

      return { embeds: [embed] };
    }

    // Trường hợp vô hiệu hóa thư mục
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

      // Thêm tất cả lệnh trong thư mục vào database
      let successCount = 0;
      for (const cmd of folderCommands) {
        const success = await disabledCommandsService.add(cmd, guildId, channelId);
        if (success) successCount++;
      }

      const embed = EmbedUtils.error(
        'Vô hiệu hóa thư mục lệnh',
        `Đã vô hiệu hóa **${successCount}** lệnh trong thư mục \`${targetName}\` cho ${scopeText}.`,
        { timestamp: true }
      );

      return { embeds: [embed] };
    }

    // Trường hợp vô hiệu hóa lệnh cụ thể
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

    // Kiểm tra xem lệnh đã bị disable chưa
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

    if (isPrefixDisabled && isSlashDisabled) {
      return { content: `Lệnh \`${command.name}\` đã bị vô hiệu hóa trong ${scopeText} rồi.` };
    }

    // Thêm vào database
    let successCount = 0;

    if (!isPrefixDisabled) {
      const prefixSuccess = await disabledCommandsService.add(commandKey, guildId, channelId);
      if (prefixSuccess) successCount++;
    }

    if (!isSlashDisabled) {
      const slashSuccess = await disabledCommandsService.add(slashCommandKey, guildId, channelId);
      if (slashSuccess) successCount++;
    }

    if (successCount > 0) {
      const embed = EmbedUtils.error(
        'Vô hiệu hóa lệnh',
        `Đã vô hiệu hóa lệnh \`${command.name}\` (prefix + slash) trong ${scopeText}.`,
        { timestamp: true }
      );

      return { embeds: [embed] };
    } else {
      return { content: 'Có lỗi xảy ra khi vô hiệu hóa lệnh.' };
    }
  },
};
