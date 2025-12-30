const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { DevID } = require('../../../config.json');

module.exports = {
  name: 'reload',
  description: 'Tải lại các thành phần của bot (chỉ dành cho admin)',
  category: 'Dev',
  aliases: ['rl'],
  usage: '[commands | events | utils | menuhandler | buttons | contexthandler | modalhandler]',
  examples: ['', 'commands', 'events', 'utils', 'menuhandler'],
  cooldown: 10,
  permissions: {
    bot: ['SendMessages', 'EmbedLinks'],
    user: 'DEV', // Chỉ dev mới được sử dụng
  },
  async execute(message, args, client) {
    // Kiểm tra quyền owner
    if (message.author.id !== DevID) {
      return { content: 'Bạn không có quyền sử dụng lệnh này.' };
    }

    // Nếu có tham số đầu tiên là "commands", tải lại tất cả commands
    if (args[0] === 'commands') {
      return reloadCommands(message, client);
    }
    // Nếu có tham số đầu tiên là "events", hiển thị menu để chọn events cần tải lại
    else if (args[0] === 'events') {
      return showEventsMenu(message, client);
    }
    // Nếu có tham số đầu tiên là "utils", hiển thị menu để chọn utils cần tải lại
    else if (args[0] === 'utils') {
      return showUtilsMenu(message, client);
    }
    // Nếu có tham số đầu tiên là "menuhandler", hiển thị menu để chọn menuhandler cần tải lại
    else if (args[0] === 'menuhandler') {
      return showMenuHandlerMenu(message, client);
    }
    // Nếu có tham số đầu tiên là "buttons", hiển thị menu để chọn buttons cần tải lại
    else if (args[0] === 'buttons') {
      return showButtonsMenu(message, client);
    }
    // Nếu có tham số đầu tiên là "contexthandler", hiển thị menu để chọn contexthandler cần tải lại
    else if (args[0] === 'contexthandler') {
      return showContextHandlerMenu(message, client);
    }
    // Nếu có tham số đầu tiên là "modalhandler", hiển thị menu để chọn modalhandler cần tải lại
    else if (args[0] === 'modalhandler') {
      return showModalHandlerMenu(message, client);
    }
    // Nếu không có tham số, hiển thị hướng dẫn sử dụng lệnh
    else {
      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('⚙️ Reload Command')
        .setDescription('Tải lại các thành phần của bot')
        .addFields({
          name: 'Sử dụng:',
          value:
            '`reload commands` - Tải lại tất cả commands\n' +
            '`reload events` - Chọn events để tải lại\n' +
            '`reload utils` - Chọn utils để tải lại\n' +
            '`reload menuhandler` - Chọn menu handlers để tải lại\n' +
            '`reload buttons` - Chọn buttons để tải lại\n' +
            '`reload contexthandler` - Chọn context handlers để tải lại\n' +
            '`reload modalhandler` - Chọn modal handlers để tải lại',
        })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    }
  },
};

// Hàm tải lại commands
async function reloadCommands(message, client) {
  try {
    // Xóa cache của commands
    Object.keys(require.cache).forEach(key => {
      if (key.includes('commands')) {
        delete require.cache[key];
      }
    });

    // Tải lại commands
    client.commands.clear();
    client.aliases.clear();
    client.slashCommands.clear();

    // Hàm tải lệnh đệ quy giống với hàm loadCommands trong index.js
    function loadCommands(dirPath, commandType) {
      const commandFiles = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));
      for (const file of commandFiles) {
        try {
          const command = require(path.join(dirPath, file));

          // Xử lý prefix commands
          if (commandType === 'prefix' && command.name) {
            client.commands.set(command.name, command);

            // Thêm aliases nếu có
            if (command.aliases && Array.isArray(command.aliases)) {
              command.aliases.forEach(alias => {
                client.aliases.set(alias, command.name);
              });
            }
            console.log(`Tải lại prefix command: ${command.name}`);
          }

          // Xử lý slash commands
          if (commandType === 'slash' && command.data && command.data.name) {
            client.slashCommands.set(command.data.name, command);
            console.log(`Tải lại slash command: ${command.data.name}`);
          }
        } catch (error) {
          console.error(`Lỗi khi tải lệnh ${file}:`, error);
        }
      }

      // Tải lệnh từ các thư mục con một cách đệ quy
      const subdirs = fs
        .readdirSync(dirPath)
        .filter(item => fs.statSync(path.join(dirPath, item)).isDirectory());
      for (const subdir of subdirs) {
        loadCommands(path.join(dirPath, subdir), commandType);
      }
    }

    // Tải lại tất cả prefix commands
    const prefixCommandsPath = path.join(__dirname, '../../prefix');
    loadCommands(prefixCommandsPath, 'prefix');

    // Tải lại tất cả slash commands
    const slashCommandsPath = path.join(__dirname, '../../slash');
    loadCommands(slashCommandsPath, 'slash');

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ Tải lại thành công!')
      .setDescription(
        `Đã tải lại ${client.commands.size} prefix commands và ${client.slashCommands.size} slash commands`
      )
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    return message.reply('❌ Có lỗi xảy ra khi tải lại commands!');
  }
}

// Hiển thị menu để chọn events cần tải lại
async function showEventsMenu(message, client) {
  try {
    // Đọc tất cả các events từ thư mục events
    const eventsPath = path.join(__dirname, '../../../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    // Tạo menu tương tác để chọn events
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select-events')
      .setPlaceholder('Chọn events cần tải lại')
      .setMinValues(1)
      .setMaxValues(eventFiles.length);

    // Thêm options cho menu
    eventFiles.forEach(file => {
      const eventName = file.slice(0, -3); // Loại bỏ phần mở rộng .js
      selectMenu.addOptions({
        label: eventName,
        value: eventName,
        description: `Tải lại event ${eventName}`,
      });
    });

    // Tạo action row chứa menu
    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Gửi tin nhắn với menu
    await message.channel.send({
      content: 'Vui lòng chọn các events cần tải lại:',
      components: [row],
    });
  } catch (error) {
    console.error(error);
    return message.reply('❌ Có lỗi xảy ra khi tải menu events!');
  }
}

// Hiển thị menu để chọn utils cần tải lại
async function showUtilsMenu(message, client) {
  try {
    // Đọc tất cả các utils từ thư mục utils
    const utilsPath = path.join(__dirname, '../../../utils');
    const utilFiles = fs.readdirSync(utilsPath).filter(file => file.endsWith('.js'));

    // Tạo menu tương tác để chọn utils
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select-utils')
      .setPlaceholder('Chọn utils cần tải lại')
      .setMinValues(1)
      .setMaxValues(utilFiles.length);

    // Thêm options cho menu
    utilFiles.forEach(file => {
      const utilName = file.slice(0, -3); // Loại bỏ phần mở rộng .js
      selectMenu.addOptions({
        label: utilName,
        value: utilName,
        description: `Tải lại util ${utilName}`,
      });
    });

    // Tạo action row chứa menu
    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Gửi tin nhắn với menu
    await message.channel.send({
      content: 'Vui lòng chọn các utils cần tải lại:',
      components: [row],
    });
  } catch (error) {
    console.error(error);
    return message.reply('❌ Có lỗi xảy ra khi tải menu utils!');
  }
}

// Hiển thị menu để chọn menu handlers cần tải lại
async function showMenuHandlerMenu(message, client) {
  try {
    // Đọc tất cả các menu handlers từ thư mục handler/Menuhandler
    const handlersPath = path.join(__dirname, '../../../handler/Menuhandler');
    const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

    // Tạo menu tương tác để chọn handlers
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select-menuhandlers')
      .setPlaceholder('Chọn menu handlers cần tải lại')
      .setMinValues(1)
      .setMaxValues(handlerFiles.length);

    // Thêm options cho menu
    handlerFiles.forEach(file => {
      const handlerName = file.slice(0, -3); // Loại bỏ phần mở rộng .js
      selectMenu.addOptions({
        label: handlerName,
        value: handlerName,
        description: `Tải lại menu handler ${handlerName}`,
      });
    });

    // Tạo action row chứa menu
    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Gửi tin nhắn với menu
    await message.channel.send({
      content: 'Vui lòng chọn các menu handlers cần tải lại:',
      components: [row],
    });
  } catch (error) {
    console.error(error);
    return message.reply('❌ Có lỗi xảy ra khi tải menu handlers!');
  }
}

// Hiển thị menu để chọn buttons cần tải lại
async function showButtonsMenu(message, client) {
  try {
    // Đọc tất cả các buttons từ thư mục buttons
    const buttonsPath = path.join(__dirname, '../../../buttons');
    const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));

    // Tạo menu tương tác để chọn buttons
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select-buttons')
      .setPlaceholder('Chọn buttons cần tải lại')
      .setMinValues(1)
      .setMaxValues(buttonFiles.length);

    // Thêm options cho menu
    buttonFiles.forEach(file => {
      const buttonName = file.slice(0, -3); // Loại bỏ phần mở rộng .js
      selectMenu.addOptions({
        label: buttonName,
        value: buttonName,
        description: `Tải lại button ${buttonName}`,
      });
    });

    // Tạo action row chứa menu
    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Gửi tin nhắn với menu
    await message.channel.send({
      content: 'Vui lòng chọn các buttons cần tải lại:',
      components: [row],
    });
  } catch (error) {
    console.error(error);
    return message.reply('❌ Có lỗi xảy ra khi tải menu buttons!');
  }
}

// Hiển thị menu để chọn context handlers cần tải lại
async function showContextHandlerMenu(message, client) {
  try {
    // Đọc tất cả các context handlers từ thư mục handler/Contexthandler
    const handlersPath = path.join(__dirname, '../../../handler/Contexthandler');
    const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

    // Tạo menu tương tác để chọn handlers
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select-contexthandlers')
      .setPlaceholder('Chọn context handlers cần tải lại')
      .setMinValues(1)
      .setMaxValues(handlerFiles.length);

    // Thêm options cho menu
    handlerFiles.forEach(file => {
      const handlerName = file.slice(0, -3); // Loại bỏ phần mở rộng .js
      selectMenu.addOptions({
        label: handlerName,
        value: handlerName,
        description: `Tải lại context handler ${handlerName}`,
      });
    });

    // Tạo action row chứa menu
    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Gửi tin nhắn với menu
    await message.channel.send({
      content: 'Vui lòng chọn các context handlers cần tải lại:',
      components: [row],
    });
  } catch (error) {
    console.error(error);
    return message.reply('❌ Có lỗi xảy ra khi tải menu context handlers!');
  }
}

// Hiển thị menu để chọn modal handlers cần tải lại
async function showModalHandlerMenu(message, client) {
  try {
    // Đọc tất cả các modal handlers từ thư mục handler/Modalhandler
    const handlersPath = path.join(__dirname, '../../../handler/Modalhandler');
    const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

    // Tạo menu tương tác để chọn handlers
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select-modalhandlers')
      .setPlaceholder('Chọn modal handlers cần tải lại')
      .setMinValues(1)
      .setMaxValues(handlerFiles.length);

    // Thêm options cho menu
    handlerFiles.forEach(file => {
      const handlerName = file.slice(0, -3); // Loại bỏ phần mở rộng .js
      selectMenu.addOptions({
        label: handlerName,
        value: handlerName,
        description: `Tải lại modal handler ${handlerName}`,
      });
    });

    // Tạo action row chứa menu
    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Gửi tin nhắn với menu
    await message.channel.send({
      content: 'Vui lòng chọn các modal handlers cần tải lại:',
      components: [row],
    });
  } catch (error) {
    console.error(error);
    return message.reply('❌ Có lỗi xảy ra khi tải menu modal handlers!');
  }
}
