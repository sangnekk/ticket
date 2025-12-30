const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { clientId, token } = require('./config.json');
const { prisma } = require('./utils/prisma');
 
// Initialize arrays for different command types
const commands = [];
const prefixCommands = {};

// Thêm biến để kiểm soát
let isDeploying = false;

// Thêm biến để xác định xem code đang chạy trực tiếp hay được import
const isRunningDirectly = require.main === module;

// Hàm để lấy danh sách guildId từ GuildSettings
async function getGuildIdsFromDatabase() {
  try {
    const guildSettings = await prisma.GuildConfig.findMany({
      select: {
        guildId: true,
      },
    });

    const guildIds = guildSettings.map(setting => setting.guildId);
    console.log(`Tìm thấy ${guildIds.length} guilds trong database:`, guildIds);
    return guildIds;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách guild từ database:', error);
    return [];
  }
}

// Function to load commands from a specific type (slash or prefix)
function loadCommands(commandType, silent = false) {
  const commandPath = path.join(__dirname, 'commands', commandType);

  // Check if directory exists first
  if (!fs.existsSync(commandPath)) {
    if (!silent) {
      console.log(`Directory not found: ${commandPath}`);
    }
    return;
  }

  // Clear existing commands before loading
  if (commandType === 'slash') {
    commands.length = 0; // Clear slash commands array
  } else if (commandType === 'prefix') {
    Object.keys(prefixCommands).forEach(key => delete prefixCommands[key]); // Clear prefix commands object
  }

  const loadedCommands = new Set(); // Track loaded command names

  const subfolders = fs.readdirSync(commandPath);

  // Process each subfolder in the commands directory
  for (const subfolder of subfolders) {
    const subfolderPath = path.join(commandPath, subfolder);

    // Check if it's actually a directory
    if (fs.statSync(subfolderPath).isDirectory()) {
      const commandFiles = fs.readdirSync(subfolderPath).filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        const filePath = path.join(subfolderPath, file);

        // Clear require cache to ensure fresh load
        delete require.cache[require.resolve(filePath)];

        try {
          const command = require(filePath);

          if (commandType === 'slash') {
            if ('data' in command && 'execute' in command) {
              const commandName = command.data.name;
              if (loadedCommands.has(commandName)) {
                console.log(
                  `⚠️ Skipping duplicate command: ${commandName} in ${subfolder}/${file}`
                );
                continue;
              }
              commands.push(command.data.toJSON());
              loadedCommands.add(commandName);
              if (!silent) {
                console.log(`✓ Loaded slash command: ${commandName} from ${subfolder}/${file}`);
              }
            } else {
              console.log(
                `✗ [WARNING] The slash command at ${filePath} is missing a required "data" or "execute" property.`
              );
            }
          } else if (commandType === 'prefix') {
            if ('name' in command && 'execute' in command) {
              if (loadedCommands.has(command.name)) {
                console.log(
                  `⚠️ Skipping duplicate command: ${command.name} in ${subfolder}/${file}`
                );
                continue;
              }
              prefixCommands[command.name] = command;
              loadedCommands.add(command.name);
              if (!silent) {
                console.log(`✓ Loaded prefix command: ${command.name} from ${subfolder}/${file}`);
              }
            } else {
              console.log(
                `✗ [WARNING] The prefix command at ${filePath} is missing a required "name" or "execute" property.`
              );
            }
          }
        } catch (error) {
          console.error(`Error loading command from ${filePath}:`, error);
        }
      }
    }
  }
}

// Create REST instance
const rest = new REST({ version: '10' }).setToken(token);

// Main deployment function
async function deployCommands(guildIds = null, loadOnly = false, silent = false) {
  // Nếu đang deploy thì bỏ qua
  if (isDeploying) {
    if (!silent) {
      console.log('Deployment already in progress, skipping...');
    }
    return {};
  }

  try {
    isDeploying = true;

    // Nếu không có guildIds được truyền vào, lấy từ database
    if (!guildIds) {
      if (!silent) {
        console.log('Không có guildIds được truyền vào, lấy từ database...');
      }
      guildIds = await getGuildIdsFromDatabase();
    }

    if (!loadOnly && !silent) {
      console.log('Loading commands...');
    }
    loadCommands('slash', loadOnly || silent);
    loadCommands('prefix', loadOnly || silent);

    if (commands.length === 0) {
      if (!silent) {
        console.log('No slash commands found to deploy!');
      }
      return {};
    }

    // Nếu chỉ load commands, không deploy - return sớm để tránh log
    if (loadOnly) {
      return { loadedCommands: commands };
    }

    if (!silent) {
      console.log('Commands to be deployed:');
    }
    const commandNames = new Set();
    const duplicateNames = new Set();

    commands.forEach(cmd => {
      if (commandNames.has(cmd.name)) {
        duplicateNames.add(cmd.name);
        if (!silent) {
          console.log(`⚠️ Duplicate command name found: ${cmd.name}`);
        }
      }
      commandNames.add(cmd.name);
      if (!silent) {
        console.log(`- ${cmd.name}`);
      }
    });

    if (duplicateNames.size > 0) {
      console.error('❌ Duplicate command names detected:', Array.from(duplicateNames));
      return {};
    }

    // Lấy danh sách commands hiện tại và so sánh trước khi deploy
    const existingCommands = await getExistingCommands(
      guildIds && guildIds.length > 0 ? guildIds[0] : null
    );

    if (shouldDeployCommands(commands, existingCommands, silent)) {
      if (!silent) {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
      }

      // Nếu không có guildIds hoặc mảng rỗng, deploy globally
      if (!guildIds || guildIds.length === 0) {
        if (!silent) {
          console.log('Deploying commands globally...');
        }
        const data = await rest.put(Routes.applicationCommands(clientId), { body: commands });
        if (!silent) {
          console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
        }
      }
      // Deploy cho nhiều server
      else {
        if (!silent) {
          console.log(`Deploying commands to ${guildIds.length} guilds...`);
        }
        for (const guildId of guildIds) {
          try {
            const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
              body: commands,
            });
            if (!silent) {
              console.log(`Successfully reloaded ${data.length} commands for guild ${guildId}`);
            }
          } catch (error) {
            console.error(`Failed to deploy commands to guild ${guildId}:`, error);
          }
        }
      }

      if (!silent) {
        console.log(`Loaded ${Object.keys(prefixCommands).length} prefix commands`);

        console.log('\nRegistered Slash Commands:');
        commands.forEach(cmd => console.log(`- /${cmd.name}`));
      }
    } else {
      if (!silent) {
        console.log('Không có thay đổi trong commands, bỏ qua việc deploy.');
      }
    }

    return { loadedCommands: commands };
  } finally {
    isDeploying = false;
  }
}

// Hàm lấy danh sách commands hiện tại
async function getExistingCommands(guildId = null) {
  try {
    const route = guildId
      ? Routes.applicationGuildCommands(clientId, guildId)
      : Routes.applicationCommands(clientId);

    const existingCommands = await rest.get(route);
    return existingCommands;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách commands hiện tại:', error);
    return []; // Trả về mảng rỗng nếu có lỗi
  }
}

// Hàm kiểm tra xem có cần deploy lại không
function shouldDeployCommands(newCommands, existingCommands, silent = false) {
  // Nếu số lượng commands khác nhau thì cần deploy
  if (newCommands.length !== existingCommands.length) {
    if (!silent) {
      console.log('Số lượng commands đã thay đổi, cần deploy lại.');
    }
    return true;
  }

  // Tạo một bản đồ commands hiện tại để dễ tra cứu
  const existingCommandsMap = {};
  existingCommands.forEach(cmd => {
    existingCommandsMap[cmd.name] = cmd;
  });

  // Kiểm tra từng command mới
  for (const newCmd of newCommands) {
    const existingCmd = existingCommandsMap[newCmd.name];

    // Nếu không tìm thấy command này trong danh sách hiện tại
    if (!existingCmd) {
      if (!silent) {
        console.log(`Command mới được tìm thấy: ${newCmd.name}`);
      }
      return true;
    }

    // So sánh cấu trúc của command (để phát hiện thay đổi trong options, description, etc.)
    if (JSON.stringify(newCmd) !== JSON.stringify(existingCmd)) {
      if (!silent) {
        console.log(`Command ${newCmd.name} đã được cập nhật, cần deploy lại.`);
      }
      return true;
    }
  }

  return false; // Không có thay đổi
}

// Thêm hàm để tự động deploy khi có thay đổi trong thư mục commands
function watchCommands(guildIds = null) {
  const commandsDir = path.join(__dirname, 'commands');

  console.log('Watching for command changes...');

  fs.watch(commandsDir, { recursive: true }, async (eventType, filename) => {
    if (filename && filename.endsWith('.js')) {
      console.log(`Detected change in ${filename}, redeploying commands...`);
      // Reset commands array before redeploying
      commands.length = 0;
      Object.keys(prefixCommands).forEach(key => delete prefixCommands[key]);

      // Nếu không có guildIds được truyền vào, lấy từ database
      let targetGuildIds = guildIds;
      if (!targetGuildIds) {
        console.log('Lấy guildIds từ database cho auto-deploy...');
        targetGuildIds = await getGuildIdsFromDatabase();
      }

      // Redeploy commands
      deployCommands(targetGuildIds);
    }
  });
}

// Thêm hàm main để xử lý các tham số từ command line
async function main() {

  const args = process.argv.slice(2);
  let guildIds =
    args.length > 0 && !args.some(arg => arg.startsWith('--'))
      ? args.filter(arg => !arg.startsWith('--'))
      : null;

  // Nếu không có guildIds được truyền vào từ command line, lấy từ database
  if (!guildIds) {
    console.log('Không có guildIds từ command line, lấy từ database...');
    guildIds = await getGuildIdsFromDatabase();
  }

  // Deploy commands lần đầu
  await deployCommands(guildIds);

  // Watch for changes if --watch flag is present
  if (args.includes('--watch')) {
    watchCommands(guildIds);
  }
}

// Chạy main chỉ khi file được gọi trực tiếp
if (isRunningDirectly) {
  main();
}

async function listExistingCommands(guildId = null) {
  try {
    const route = guildId
      ? Routes.applicationGuildCommands(clientId, guildId)
      : Routes.applicationCommands(clientId);

    const commands = await rest.get(route);
    console.log('\nExisting commands:');
    commands.forEach(cmd => console.log(`- ${cmd.name} (ID: ${cmd.id})`));
  } catch (error) {
    console.error('Error listing commands:', error);
  }
}

// Thêm cleanup khi chương trình kết thúc
process.on('SIGINT', async () => {
  console.log('\nĐang đóng kết nối database...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nĐang đóng kết nối database...');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = {
  deployCommands,
  getExistingCommands,
  shouldDeployCommands,
  listExistingCommands,
  getGuildIdsFromDatabase,
};
