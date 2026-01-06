const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { DevID } = require('../../../config.json');
const EmbedComponentsV2 = require('../../../utils/embedComponentsV2');

module.exports = {
  name: 'reload',
  description: 'Tải lại các thành phần của bot (chỉ dành cho admin)',
  category: 'Dev',
  aliases: ['rl'],
  usage: '[commands | events | utils | menuhandler | buttons | contexthandler | modalhandler | prisma | all]',
  examples: ['', 'commands', 'events', 'utils', 'prisma', 'all'],
  cooldown: 10,
  permissions: {
    bot: ['SendMessages', 'EmbedLinks'],
    user: 'DEV',
  },
  async execute(message, args, client) {
    if (message.author.id !== DevID) {
      return { content: 'Bạn không có quyền sử dụng lệnh này.' };
    }

    if (args[0] === 'commands') {
      return reloadCommands(message, client);
    } else if (args[0] === 'events') {
      return showEventsMenu(message);
    } else if (args[0] === 'utils') {
      return showUtilsMenu(message);
    } else if (args[0] === 'menuhandler') {
      return showMenuHandlerMenu(message);
    } else if (args[0] === 'buttons') {
      return showButtonsMenu(message);
    } else if (args[0] === 'contexthandler') {
      return showContextHandlerMenu(message);
    } else if (args[0] === 'modalhandler') {
      return showModalHandlerMenu(message);
    } else if (args[0] === 'prisma') {
      return reloadPrisma(message, client);
    } else if (args[0] === 'all') {
      return reloadAll(message, client);
    } else {
      const container = EmbedComponentsV2.createContainer();
      
      container.addTextDisplay(`## ⚙️ Reload Command`);
      container.addSeparator({ divider: true });
      container.addTextDisplay(`Tải lại các thành phần của bot`);
      container.addTextDisplay(`
**Sử dụng:**
\`reload commands\` - Tải lại tất cả commands
\`reload events\` - Chọn events để tải lại
\`reload utils\` - Chọn utils để tải lại
\`reload menuhandler\` - Chọn menu handlers để tải lại
\`reload buttons\` - Chọn buttons để tải lại
\`reload contexthandler\` - Chọn context handlers để tải lại
\`reload modalhandler\` - Chọn modal handlers để tải lại
\`reload prisma\` - 🔥 Tải lại Prisma Client (không cần restart!)
\`reload all\` - 🚀 Tải lại tất cả (full reload)`);
      container.addTextDisplay(`-# <t:${Math.floor(Date.now() / 1000)}:f>`);

      await message.channel.send(container.build());
    }
  },
};

async function reloadCommands(message, client) {
  try {
    Object.keys(require.cache).forEach(key => {
      if (key.includes('commands')) {
        delete require.cache[key];
      }
    });

    client.commands.clear();
    client.aliases.clear();
    client.slashCommands.clear();

    function loadCommands(dirPath, commandType) {
      const commandFiles = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));
      for (const file of commandFiles) {
        try {
          const command = require(path.join(dirPath, file));

          if (commandType === 'prefix' && command.name) {
            client.commands.set(command.name, command);
            if (command.aliases && Array.isArray(command.aliases)) {
              command.aliases.forEach(alias => {
                client.aliases.set(alias, command.name);
              });
            }
            console.log(`Tải lại prefix command: ${command.name}`);
          }

          if (commandType === 'slash' && command.data && command.data.name) {
            client.slashCommands.set(command.data.name, command);
            console.log(`Tải lại slash command: ${command.data.name}`);
          }
        } catch (error) {
          console.error(`Lỗi khi tải lệnh ${file}:`, error);
        }
      }

      const subdirs = fs
        .readdirSync(dirPath)
        .filter(item => fs.statSync(path.join(dirPath, item)).isDirectory());
      for (const subdir of subdirs) {
        loadCommands(path.join(dirPath, subdir), commandType);
      }
    }

    const prefixCommandsPath = path.join(__dirname, '../../prefix');
    loadCommands(prefixCommandsPath, 'prefix');

    const slashCommandsPath = path.join(__dirname, '../../slash');
    loadCommands(slashCommandsPath, 'slash');

    const container = EmbedComponentsV2.createContainer();
    container.addTextDisplay(`## ✅ Tải lại thành công!`);
    container.addSeparator({ divider: true });
    container.addTextDisplay(`Đã tải lại **${client.commands.size}** prefix commands và **${client.slashCommands.size}** slash commands`);
    container.addTextDisplay(`-# <t:${Math.floor(Date.now() / 1000)}:f>`);

    await message.channel.send(container.build());
  } catch (error) {
    console.error(error);
    return message.reply('❌ Có lỗi xảy ra khi tải lại commands!');
  }
}

async function showEventsMenu(message) {
  try {
    const eventsPath = path.join(__dirname, '../../../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select-events')
      .setPlaceholder('Chọn events cần tải lại')
      .setMinValues(1)
      .setMaxValues(eventFiles.length);

    eventFiles.forEach(file => {
      const eventName = file.slice(0, -3);
      selectMenu.addOptions({
        label: eventName,
        value: eventName,
        description: `Tải lại event ${eventName}`,
      });
    });

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await message.channel.send({ content: 'Vui lòng chọn các events cần tải lại:', components: [row] });
  } catch (error) {
    console.error(error);
    return message.reply('❌ Có lỗi xảy ra khi tải menu events!');
  }
}

async function showUtilsMenu(message) {
  try {
    const utilsPath = path.join(__dirname, '../../../utils');
    const utilFiles = fs.readdirSync(utilsPath).filter(file => file.endsWith('.js'));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select-utils')
      .setPlaceholder('Chọn utils cần tải lại')
      .setMinValues(1)
      .setMaxValues(utilFiles.length);

    utilFiles.forEach(file => {
      const utilName = file.slice(0, -3);
      selectMenu.addOptions({
        label: utilName,
        value: utilName,
        description: `Tải lại util ${utilName}`,
      });
    });

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await message.channel.send({ content: 'Vui lòng chọn các utils cần tải lại:', components: [row] });
  } catch (error) {
    console.error(error);
    return message.reply('❌ Có lỗi xảy ra khi tải menu utils!');
  }
}

async function showMenuHandlerMenu(message) {
  try {
    const handlersPath = path.join(__dirname, '../../../handler/Menuhandler');
    const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select-menuhandlers')
      .setPlaceholder('Chọn menu handlers cần tải lại')
      .setMinValues(1)
      .setMaxValues(handlerFiles.length);

    handlerFiles.forEach(file => {
      const handlerName = file.slice(0, -3);
      selectMenu.addOptions({
        label: handlerName,
        value: handlerName,
        description: `Tải lại menu handler ${handlerName}`,
      });
    });

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await message.channel.send({ content: 'Vui lòng chọn các menu handlers cần tải lại:', components: [row] });
  } catch (error) {
    console.error(error);
    return message.reply('❌ Có lỗi xảy ra khi tải menu handlers!');
  }
}

async function showButtonsMenu(message) {
  try {
    const buttonsPath = path.join(__dirname, '../../../buttons');
    const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select-buttons')
      .setPlaceholder('Chọn buttons cần tải lại')
      .setMinValues(1)
      .setMaxValues(buttonFiles.length);

    buttonFiles.forEach(file => {
      const buttonName = file.slice(0, -3);
      selectMenu.addOptions({
        label: buttonName,
        value: buttonName,
        description: `Tải lại button ${buttonName}`,
      });
    });

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await message.channel.send({ content: 'Vui lòng chọn các buttons cần tải lại:', components: [row] });
  } catch (error) {
    console.error(error);
    return message.reply('❌ Có lỗi xảy ra khi tải menu buttons!');
  }
}

async function showContextHandlerMenu(message) {
  try {
    const handlersPath = path.join(__dirname, '../../../handler/Contexthandler');
    const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select-contexthandlers')
      .setPlaceholder('Chọn context handlers cần tải lại')
      .setMinValues(1)
      .setMaxValues(handlerFiles.length);

    handlerFiles.forEach(file => {
      const handlerName = file.slice(0, -3);
      selectMenu.addOptions({
        label: handlerName,
        value: handlerName,
        description: `Tải lại context handler ${handlerName}`,
      });
    });

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await message.channel.send({ content: 'Vui lòng chọn các context handlers cần tải lại:', components: [row] });
  } catch (error) {
    console.error(error);
    return message.reply('❌ Có lỗi xảy ra khi tải menu context handlers!');
  }
}

async function showModalHandlerMenu(message) {
  try {
    const handlersPath = path.join(__dirname, '../../../handler/Modalhandler');
    const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select-modalhandlers')
      .setPlaceholder('Chọn modal handlers cần tải lại')
      .setMinValues(1)
      .setMaxValues(handlerFiles.length);

    handlerFiles.forEach(file => {
      const handlerName = file.slice(0, -3);
      selectMenu.addOptions({
        label: handlerName,
        value: handlerName,
        description: `Tải lại modal handler ${handlerName}`,
      });
    });

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await message.channel.send({ content: 'Vui lòng chọn các modal handlers cần tải lại:', components: [row] });
  } catch (error) {
    console.error(error);
    return message.reply('❌ Có lỗi xảy ra khi tải menu modal handlers!');
  }
}
