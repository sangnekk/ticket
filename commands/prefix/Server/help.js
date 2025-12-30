const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { T } = require('../../../plugins/i18n');
const { GT } = require('../../../utils/guildI18n');
const { getGuildLanguage, getGuildPrefix } = require('../../../utils/prisma');

module.exports = {
  name: 'help',
  description: 'Hiển thị danh sách lệnh hoặc thông tin chi tiết về một lệnh cụ thể',
  aliases: ['command', 'commands'],
  examples: ['', 'ping', 'avatar'],
  usage: '[tên_lệnh]',
  cooldown: 3,
  permissions: {
    bot: ['SendMessages', 'EmbedLinks'],
    user: [], // Không yêu cầu quyền đặc biệt
  },
  async execute(message, args, client) {
    // Lấy ngôn ngữ của người dùng từ database
    let userLocale = await getGuildLanguage(message.guild.id);
    if (!userLocale) {
      userLocale = message.guild?.preferredLocale || client.config?.defaultLanguage || 'Vietnamese';
    }

    // Lấy prefix từ database
    const currentPrefix = (await getGuildPrefix(message.guild.id)) || '!';

    // Paths to command directories
    const commandsPath = path.join(__dirname, '..', '..');
    const prefixCommandsPath = path.join(commandsPath, 'prefix');
    const slashCommandsPath = path.join(commandsPath, 'slash');

    // Get all commands across all categories
    function getAllCommands(commandPath, type) {
      const allCommands = {};

      if (!fs.existsSync(commandPath)) {
        console.warn(`Warning: The path ${commandPath} does not exist.`);
        return allCommands;
      }

      try {
        const categoryFolders = fs.readdirSync(commandPath);

        for (const category of categoryFolders) {
          const categoryPath = path.join(commandPath, category);

          if (fs.statSync(categoryPath).isDirectory()) {
            const categoryCommands = [];
            const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
              const filePath = path.join(categoryPath, file);
              try {
                const command = require(filePath);
                if (type === 'prefix' && 'name' in command && command.name) {
                  categoryCommands.push(command);
                } else if (type === 'slash' && 'data' in command && command.data) {
                  categoryCommands.push(command);
                }
              } catch (error) {
                console.error(`Error loading command file ${filePath}:`, error);
              }
            }

            if (categoryCommands.length > 0) {
              allCommands[category] = categoryCommands;
            }
          }
        }
      } catch (error) {
        console.error(`Error reading commands from ${commandPath}:`, error);
      }

      return allCommands;
    }

    // Function to check command type
    function checkCommandType(commandName, prefixPath, slashPath) {
      let isPrefixCommand = false;
      let isSlashCommand = false;

      // Check prefix commands
      try {
        const prefixCategories = fs.readdirSync(prefixPath);
        for (const category of prefixCategories) {
          const categoryPath = path.join(prefixPath, category);
          if (fs.statSync(categoryPath).isDirectory()) {
            const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
              const command = require(path.join(categoryPath, file));
              if (command.name && command.name.toLowerCase() === commandName.toLowerCase()) {
                isPrefixCommand = true;
                break;
              }
            }
          }
          if (isPrefixCommand) break;
        }
      } catch (error) {
        console.error('Error checking prefix commands:', error);
      }

      // Check slash commands
      try {
        const slashCategories = fs.readdirSync(slashPath);
        for (const category of slashCategories) {
          const categoryPath = path.join(slashPath, category);
          if (fs.statSync(categoryPath).isDirectory()) {
            const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
              const command = require(path.join(categoryPath, file));
              if (command.data && command.data.name.toLowerCase() === commandName.toLowerCase()) {
                isSlashCommand = true;
                break;
              }
            }
          }
          if (isSlashCommand) break;
        }
      } catch (error) {
        console.error('Error checking slash commands:', error);
      }

      // Determine command type
      if (isPrefixCommand && isSlashCommand) {
        return 'Prefix and Slash';
      } else if (isPrefixCommand) {
        return 'Prefix';
      } else if (isSlashCommand) {
        return 'Slash';
      } else {
        return 'Không xác định';
      }
    }

    // Get categories for prefix and slash commands
    const prefixCategories = getAllCommands(prefixCommandsPath, 'prefix');
    const slashCategories = getAllCommands(slashCommandsPath, 'slash');

    // Merge commands, giving preference to prefix commands
    const mergedCategories = {};

    // Combine categories, giving preference to prefix commands
    Object.keys({ ...prefixCategories, ...slashCategories }).forEach(category => {
      const prefixCmds = prefixCategories[category] || [];
      const slashCmds = slashCategories[category] || [];

      // Create a map of slash commands by name
      const slashCmdMap = new Map(
        slashCmds.map(cmd => [(cmd.data ? cmd.data.name : cmd.name).toLowerCase(), cmd])
      );

      // Combine commands, keeping prefix commands and adding slash commands only if no prefix equivalent
      const combinedCmds = [
        ...prefixCmds,
        ...slashCmds.filter(slashCmd => {
          const slashCmdName = slashCmd.data ? slashCmd.data.name : slashCmd.name;
          return !prefixCmds.some(
            prefixCmd => prefixCmd.name.toLowerCase() === slashCmdName.toLowerCase()
          );
        }),
      ];

      if (combinedCmds.length > 0) {
        mergedCategories[category] = combinedCmds;
      }
    });

    const allCommands = Object.values(mergedCategories).flat();

    // If a specific command is requested
    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      const foundCommand = allCommands.find(cmd => {
        const cmdName = cmd.name || (cmd.data && cmd.data.name);
        return cmdName.toLowerCase() === commandName;
      });

      if (foundCommand) {
        // Check command type
        const commandType = checkCommandType(
          foundCommand.name || (foundCommand.data && foundCommand.data.name),
          prefixCommandsPath,
          slashCommandsPath
        );

        // Extract command details
        const commandDetails = {
          name: foundCommand.name || (foundCommand.data && foundCommand.data.name),
          description:
            foundCommand.description ||
            (foundCommand.data && foundCommand.data.description) ||
            (await GT(message.guild?.id, userLocale, 'use_many.dont_have_data')),
          category:
            Object.keys(mergedCategories).find(category =>
              mergedCategories[category].includes(foundCommand)
            ) || (await GT(message.guild?.id, userLocale, 'use_many.dont_have')),
          aliases: foundCommand.aliases || [],
          examples:
            foundCommand.examples || [
              await GT(message.guild?.id, userLocale, 'use_many.dont_have'),
            ],
          usage: foundCommand.usage || '',
          cooldown: foundCommand.cooldown || 0,
          type: commandType,
        };

        // Tạo trường hướng dẫn sử dụng
        const usageField = commandType.includes('Prefix')
          ? prefixes
              .map(
                p =>
                  `\`${p}${commandDetails.name}${commandDetails.usage ? ` ${commandDetails.usage}` : ''}\``
              )
              .join('or')
          : `\`/${commandDetails.name}${commandDetails.usage ? ` ${commandDetails.usage}` : ''}\``;

        // Create a detailed embed for the specific command
        const commandEmbed = new EmbedBuilder()
          .setColor('#beff6e')
          .setTitle(
            `**${await GT(message.guild?.id, userLocale, 'help.title')} - ${
              commandDetails.name
            }**`
          )
          .addFields([
            {
              name: '**Mô tả:**',
              value:
                (await GT(message.guild?.id, userLocale, `desc.${commandDetails.name}`)) ||
                commandDetails.description,
            },
            {
              name: '**Cách sử dụng:**',
              value: usageField,
            },
            {
              name: '**Ví dụ:**',
              value: commandType.includes('Prefix')
                ? commandDetails.examples
                    .map(ex => {
                      // Hiển thị ví dụ với tất cả các prefix trên cùng một dòng
                      return prefixes
                        .map(p => `\`${p}${commandDetails.name}${ex ? ` ${ex}` : ''}\``)
                        .join(' or ');
                    })
                    .join('\n')
                : commandDetails.examples
                    .map(ex => `\`/${commandDetails.name}${ex ? ` ${ex}` : ''}\``)
                    .join('\n') ||
                  (await GT(message.guild?.id, userLocale, 'use_many.dont_have')),
            },
            {
              name: '**Cách sài khác:**',
              value:
                commandDetails.aliases.length > 0
                  ? commandDetails.aliases
                      .map(alias => {
                        // Hiển thị aliases với tất cả các prefix trên cùng một dòng
                        return prefixes.map(p => `\`${p}${alias}\``).join(' or ');
                      })
                      .join('\n')
                  : await GT(message.guild?.id, userLocale, 'use_many.dont_have'),
            },
            {
              name: '**Danh mục:**',
              value: commandDetails.category,
            },
            {
              name: '**Loại lệnh:**',
              value: commandDetails.type,
            },
            {
              name: '**Thời gian chờ:**',
              value: `${commandDetails.cooldown} giây`,
            },
          ])
          .setFooter({
            text: await GT(message.guild?.id, userLocale, 'help.footer', {
              prefix: currentPrefix,
            }),
            iconURL: message.guild.iconURL({ dynamic: true }),
          });

        return { embed: commandEmbed };
      } else {
        return {
          content: await GT(message.guild?.id, userLocale, 'error.help.cmd_not_found', {
            cmd: commandName,
          }),
          ephemeral: true,
        };
      }
    }

    // If no specific command or command not found, show category selection
    if (Object.keys(mergedCategories).length === 0) {
      return message.reply(
        await GT(message.guild?.id, userLocale, 'help.no_commands')
      );
    }

    // Create a select menu for categories
    const selectMenuPlaceholder = await GT(
      message.guild?.id,
      userLocale,
      'help.select_category'
    );

    const selectMenuOptions = [];
    for (const category of Object.keys(mergedCategories)) {
      const description = await GT(
        message.guild?.id,
        userLocale,
        'help.category_description',
        { category }
      );
      selectMenuOptions.push({
        label: category.charAt(0).toUpperCase() + category.slice(1),
        description,
        value: category,
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_category')
      .setPlaceholder(selectMenuPlaceholder)
      .addOptions(selectMenuOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Send the initial embed with the select menu
    const initialEmbed = new EmbedBuilder()
      .setColor('#beff6e')
      .setTitle(await GT(message.guild?.id, userLocale, 'help.title'))
      .setDescription(await GT(message.guild?.id, userLocale, 'help.description'))
      .addFields([
        {
          name: await GT(message.guild?.id, userLocale, 'help.total_categories'),
          value: `**${Object.keys(mergedCategories).length}** ${await GT(
            message.guild?.id,
            userLocale,
            'help.categories_count',
            { count: Object.keys(mergedCategories).length }
          )}`,
          inline: true,
        },
        {
          name: await GT(message.guild?.id, userLocale, 'help.total_commands'),
          value: `**${allCommands.length}** ${await GT(
            message.guild?.id,
            userLocale,
            'help.commands_count',
            { count: allCommands.length }
          )}`,
          inline: true,
        },
      ])
      .setFooter({
        text: await GT(message.guild?.id, userLocale, 'help.footer'),
        iconURL: message.guild.iconURL({ dynamic: true }),
      })
      .setTimestamp();

    // Trả về kết quả ban đầu
    return {
      embed: initialEmbed,
      components: [row],
      ephemeral: false,
      // Thêm collector để xử lý tương tác
      collector: {
        time: 120000,
        handler: async interaction => {
          if (!interaction.isStringSelectMenu()) return;

          const category = interaction.values[0];
          const commands = mergedCategories[category];

          const categoryEmbed = new EmbedBuilder()
            .setColor('#beff6e')
            .setTitle(
              `📂 Lệnh trong danh mục ${category.charAt(0).toUpperCase() + category.slice(1)}`
            )
            .setDescription(
              commands
                .map(cmd => {
                  const commandName = cmd.name || (cmd.data && cmd.data.name);
                  const commandDesc = cmd.description || (cmd.data && cmd.data.description);
                  const commandType = checkCommandType(
                    commandName,
                    prefixCommandsPath,
                    slashCommandsPath
                  );
                  const commandUsage = cmd.usage || '';

                  // Hiển thị prefix đầu tiên cho danh sách lệnh để gọn gàng hơn
                  // và thêm ghi chú về các prefix khác
                  const commandPrefix = commandType.includes('Prefix')
                    ? `${prefixes[0]}` +
                      (prefixes.length > 1 ? ` (or ${prefixes.slice(1).join(', ')})` : '')
                    : '/';

                  // Hiển thị thêm cách sử dụng lệnh trong danh sách
                  return `**${commandPrefix}${commandName}${commandUsage ? ` ${commandUsage}` : ''}** - ${commandDesc} (${commandType})`;
                })
                .join('\n')
            )
            .setFooter({
              text: `Sử dụng ${prefixes.join('or')}help <lệnh> để xem chi tiết`,
              iconURL: message.guild.iconURL({ dynamic: true }),
            })
            .setTimestamp();

          // Trả về đối tượng để hệ thống xử lý tương tác cập nhật
          return {
            embeds: [categoryEmbed],
            components: [row],
          };
        },
        end: (collected, reason) => {
          row.components[0].setDisabled(true);
          // Trả về đối tượng components đã cập nhật
          return {
            components: [row],
          };
        },
      },
    };
  },
};
