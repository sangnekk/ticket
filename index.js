const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const { token, DevID } = config;
const { loadDisabledCommands } = require('./utils/disabledCommands');
const { connectDatabase, disconnectDatabase } = require('./utils/prisma.js');
const { initI18n, i18n, T } = require('./plugins/i18n');

// Lấy cluster ID và shard IDs từ environment variables (được set bởi cluster manager)
const clusterId = parseInt(process.env.CLUSTER_ID) || 0;
const shardIds = process.env.SHARD_IDS ? JSON.parse(process.env.SHARD_IDS) : undefined;
const totalShards = process.env.TOTAL_SHARDS ? parseInt(process.env.TOTAL_SHARDS) : undefined;

// Create a client with all necessary intents
const clientOptions = {
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
  ],
};

// Nếu có shard IDs, thêm vào client options
if (shardIds !== undefined) {
  clientOptions.shards = shardIds;
  clientOptions.shardCount = totalShards;
}

const client = new Client(clientOptions);

client.setMaxListeners(20);
client.commands = new Collection();
client.slashCommands = new Collection();
client.aliases = new Collection();
client.config = { DevID }; // Gán DevID vào client.config
client.clusterId = clusterId;
client.shardIds = shardIds || [0];
// Prefix sẽ được load từ database cho mỗi guild
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();
client.contextCommands = new Collection();

// Khởi tạo và tải các lệnh bị vô hiệu hóa
client.disabledCommands = new Set();

// Khởi tạo Map lưu trữ ngôn ngữ cho mỗi guild
client.guildLanguages = new Map();

// Connect tới database trước khi load dữ liệu
async function initialize() {
  try {
    // Kết nối tới database
    await connectDatabase();

    // Load các lệnh bị vô hiệu hóa từ database
    await loadDisabledCommands(client.disabledCommands);

    // Tiếp tục quá trình khởi động bot
    startBot();
  } catch (error) {
    console.error(`[Cluster ${clusterId}] Lỗi khi khởi tạo:`, error);
    process.exit(1);
  }
}

// Tách logic khởi động bot sang hàm riêng
function startBot() {
  // Khởi tạo i18n TRƯỚC KHI load commands
  initI18n(client);

  // Recursive function to load commands
  function loadCommands(dirPath, commandType) {
    const commandFiles = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      try {
        const command = require(path.join(dirPath, file));

        // For slash commands
        if (commandType === 'slash' && command.data && command.data.name) {
          client.slashCommands.set(command.data.name, command);
          if (config.debug) {
            console.log(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'load.slash_command', { name: command.data.name })}`);
          }
        }

        // For prefix commands
        if (commandType === 'prefix' && command.name) {
          client.commands.set(command.name, command);

          // Add alias handling for prefix commands
          if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach(alias => {
              client.aliases.set(alias, command.name);
            });
          }
          if (config.debug) {
            console.log(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'load.prefix_command', { name: command.name })}`);
          }
        }
      } catch (error) {
        console.error(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'error.command_load', { file, error })}`);
      }
    }

    // Recursively load commands from subdirectories
    const subdirs = fs
      .readdirSync(dirPath)
      .filter(item => fs.statSync(path.join(dirPath, item)).isDirectory());
    for (const subdir of subdirs) {
      loadCommands(path.join(dirPath, subdir), commandType);
    }
  }

  // Load prefix commands
  loadCommands(path.join(__dirname, 'commands', 'prefix'), 'prefix');

  // Load slash commands
  loadCommands(path.join(__dirname, 'commands', 'slash'), 'slash');

  // Load buttons
  const buttonsPath = path.join(__dirname, 'buttons');
  const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));

  for (const file of buttonFiles) {
    const button = require(path.join(buttonsPath, file));
    if (button.customId && button.execute) {
      client.buttons.set(button.customId, button);
    }
  }

  // Load select menus (nếu có)
  const selectMenusPath = path.join(__dirname, 'handler', 'Menuhandler');
  const selectMenuFiles = fs.readdirSync(selectMenusPath).filter(file => file.endsWith('.js'));

  for (const file of selectMenuFiles) {
    const selectMenu = require(path.join(selectMenusPath, file));
    if (selectMenu.customId && selectMenu.execute) {
      client.selectMenus.set(selectMenu.customId, selectMenu);
    }
  }

  // Load modals (nếu có)
  const modalsPath = path.join(__dirname, 'handler', 'Modalhandler');
  const modalFiles = fs.readdirSync(modalsPath).filter(file => file.endsWith('.js'));

  for (const file of modalFiles) {
    const modal = require(path.join(modalsPath, file));
    if (modal.customId && modal.execute) {
      client.modals.set(modal.customId, modal);
    }
  }

  // Load context commands (nếu có)
  const contextCommandsPath = path.join(__dirname, 'handler', 'Contexthandler');
  const contextCommandFiles = fs
    .readdirSync(contextCommandsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of contextCommandFiles) {
    const contextCommand = require(path.join(contextCommandsPath, file));
    if (contextCommand.customId && contextCommand.execute) {
      client.contextCommands.set(contextCommand.customId, contextCommand);
    }
  }

  // Load events
  const eventFiles = fs
    .readdirSync(path.join(__dirname, 'events'))
    .filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    try {
      const event = require(`./events/${file}`);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      if (config.debug) {
        console.log(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'load.event', { name: event.name })}`);
      }
    } catch (error) {
      console.error(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'error.event_load', { file, error })}`);
    }
  }

  // Ready event
  client.once(Events.ClientReady, async c => {
    const shardInfo = shardIds ? `Shards [${shardIds.join(', ')}]` : 'No Shards';
    console.log(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'ready', { tag: c.user.tag })} - ${shardInfo}`);
    
    // Khởi tạo Config Sync để nhận real-time updates từ web
    try {
      const configSync = require('./utils/configSync');
      await configSync.initialize();
      
      // Lắng nghe stock config updates
      configSync.on('stock', (guildId, config) => {
        console.log(`[Cluster ${clusterId}] 📥 Nhận stock config update cho guild ${guildId}`);
        // Config đã được lưu vào database, bot sẽ tự động lấy từ DB khi cần
        // Không cần cache vì mỗi lần chạy command đều query DB
      });
      
      // Lắng nghe text override updates
      configSync.on('text-override', (guildId, config) => {
        console.log(`[Cluster ${clusterId}] 📥 Nhận text override update cho guild ${guildId}`);
      });
      
      console.log(`[Cluster ${clusterId}] ✅ Config sync đã sẵn sàng`);
    } catch (err) {
      console.error(`[Cluster ${clusterId}] ⚠️ Không thể khởi tạo config sync:`, err.message);
    }
    
    // Thông báo cluster đã sẵn sàng qua IPC
    process.send?.({ name: 'ready', clusterId, shardIds });
  });

  // Error handling
  client.on('error', error => {
    console.error(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'error.websocket', { error })}`);
  });

  process.on('unhandledRejection', error => {
    console.error(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'error.unhandled_rejection', { error })}`);
  });

  // Xử lý đóng kết nối database khi ứng dụng tắt
  process.on('SIGINT', async () => {
    console.log(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'database.closing')}`);
    await disconnectDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'database.closing')}`);
    await disconnectDatabase();
    process.exit(0);
  });

  // Lắng nghe message từ cluster manager
  process.on('message', async msg => {
    if (msg.name === 'shutdown') {
      console.log(`[Cluster ${clusterId}] Nhận lệnh shutdown, đang tắt...`);
      await disconnectDatabase();
      client.destroy();
      process.exit(0);
    } else if (msg.name === 'eval' && msg.code) {
      try {
        const result = eval(msg.code);
        process.send?.({ name: 'evalResult', clusterId, result });
      } catch (error) {
        process.send?.({ name: 'evalResult', clusterId, error: error.message });
      }
    }
  });

  // Login to Discord (supports multiple tokens for multi-server bots)
  function loginBot() {
    const loginToken = token;
    
    // If tokens is an array, login to each token
    if (Array.isArray(loginToken)) {
      loginToken.forEach((t, index) => {
        client
          .login(t)
          .then(() => {
            console.log(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'login.success_multiple', { index: index + 1 })}`);
          })
          .catch(error => {
            console.error(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'login.error_multiple', { index: index + 1, error })}`);
          });
      });
    }
    // If tokens is a single string, login to that token
    else if (typeof loginToken === 'string') {
      client
        .login(loginToken)
        .then(() => {
          console.log(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'login.success')}`);
        })
        .catch(error => {
          console.error(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'login.error', { error })}`);
        });
    }
    // If no tokens provided, log an error
    else {
      console.error(`[Cluster ${clusterId}] ${T(i18n.getLocale(), 'login.no_token')}`);
    }
  }

  // Login to Discord
  loginBot();
}

// Khởi động bot
// Nếu có CLUSTER_ID hoặc SHARD_IDS trong env, đó là child process từ cluster manager
// Nếu không, đó là chế độ standalone
initialize();

