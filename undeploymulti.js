const { REST, Routes, Client, GatewayIntentBits } = require('discord.js');
const { bots } = require('./bots.json');

// Tạo client với intent cần thiết
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Function để xóa commands cho tất cả guild của một bot
async function deleteAllGuildCommands(rest, clientId, botName) {
  try {
    console.log(`[${botName}] Bắt đầu xóa các lệnh (/) cho tất cả các guild`);

    // Lấy danh sách tất cả các guild
    const guilds = Array.from(client.guilds.cache.values());
    console.log(`[${botName}] Tìm thấy ${guilds.length} guild`);

    // Xóa commands cho từng guild
    for (const guild of guilds) {
      try {
        console.log(`[${botName}] Đang xóa commands cho guild: ${guild.name} (${guild.id})`);
        await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: [] });
        console.log(`[${botName}] ✅ Đã xóa commands cho guild: ${guild.name}`);
      } catch (error) {
        console.error(`[${botName}] ❌ Lỗi khi xóa commands cho guild ${guild.name}:`, error);
      }
    }

    console.log(`[${botName}] Hoàn tất việc xóa commands cho tất cả guild`);
  } catch (error) {
    console.error(`[${botName}] Có lỗi khi xóa commands:`, error);
  }
}

// Function để xóa global commands của một bot
async function deleteGlobalCommands(rest, clientId, botName) {
  try {
    console.log(`[${botName}] Bắt đầu xóa các lệnh global (/)`);
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    console.log(`[${botName}] ✅ Đã xóa thành công tất cả các lệnh global`);
  } catch (error) {
    console.error(`[${botName}] ❌ Có lỗi khi xóa lệnh global:`, error);
  }
}

// Function để xử lý undeploy cho một bot
async function undeployBot(bot) {
  const rest = new REST().setToken(bot.token);
  await deleteAllGuildCommands(rest, bot.clientId, bot.name);
  await deleteGlobalCommands(rest, bot.clientId, bot.name);
}

// Main execution
async function main() {
  try {
    console.log('Bắt đầu quá trình undeploy cho tất cả các bot');

    // Xử lý undeploy cho từng bot
    for (const bot of bots) {
      console.log(`\n=== Đang xử lý bot: ${bot.name} ===`);
      await undeployBot(bot);
    }

    console.log('\n✅ Hoàn tất quá trình undeploy cho tất cả các bot');
  } catch (error) {
    console.error('❌ Có lỗi trong quá trình undeploy:', error);
  } finally {
    process.exit(0);
  }
}

// Chạy chương trình
main();
