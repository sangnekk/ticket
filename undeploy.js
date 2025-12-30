const { REST, Routes, Client, GatewayIntentBits } = require('discord.js');
const { token, clientId } = require('./config.json');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const rest = new REST().setToken(token);

// Function to delete commands for all guilds
async function deleteAllGuildCommands() {
  try {
    console.log('Bắt đầu xóa các lệnh (/) cho tất cả các guild');

    // Lấy danh sách tất cả các guild
    const guilds = Array.from(client.guilds.cache.values());
    console.log(`Tìm thấy ${guilds.length} guild`);

    // Xóa commands cho từng guild
    for (const guild of guilds) {
      try {
        console.log(`Đang xóa commands cho guild: ${guild.name} (${guild.id})`);
        await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: [] });
        console.log(`✅ Đã xóa commands cho guild: ${guild.name}`);
      } catch (error) {
        console.error(`❌ Lỗi khi xóa commands cho guild ${guild.name}:`, error);
      }
    }

    console.log('Hoàn tất việc xóa commands cho tất cả guild');
  } catch (error) {
    console.error('Có lỗi khi xóa commands:', error);
  }
}

// Function to delete global commands
async function deleteGlobalCommands() {
  try {
    console.log('Bắt đầu xóa các lệnh global (/)');
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    console.log('✅ Đã xóa thành công tất cả các lệnh global');
  } catch (error) {
    console.error('❌ Có lỗi khi xóa lệnh global:', error);
  }
}

// Main execution
client.once('ready', async () => {
  console.log(`Đã đăng nhập với tên ${client.user.tag}`);

  // Xóa commands cho tất cả guild
  await deleteAllGuildCommands();

  // Xóa global commands
  await deleteGlobalCommands();

  // Đóng client sau khi hoàn thành
  client.destroy();
  process.exit(0);
});

// Login to Discord
client.login(token);
