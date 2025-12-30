const { deployCommands, getExistingCommands, shouldDeployCommands } = require('../deploy.js');
const { ActivityType, Events } = require('discord.js');
const { checkExpiredCooldowns } = require('../utils/cooldown.js');
const { getRedisClient } = require('../utils/redis');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    // Khởi tạo Redis client sẵn để sử dụng
    try {
      getRedisClient();
    } catch (error) {
      console.error('[Redis] Lỗi khi khởi tạo Redis:', error);
    }

    // Chỉ log thông tin guild, không deploy
    const guilds = client.guilds.cache.map(guild => guild.id);
    console.log(`Bot is present in ${guilds.length} servers`);

    // Deploy slash commands cho từng guild khi bot khởi động
    async function deployToGuild(guildId, guildName = 'Unknown') {
      try {
        const existingCommands = await getExistingCommands(guildId);
        const { loadedCommands } = await deployCommands([guildId], true);

        if (shouldDeployCommands(loadedCommands, existingCommands, true)) {
          await deployCommands([guildId], false, true);
          console.log(`Successfully deployed commands to server: ${guildName} (${guildId})`);
          return true;
        }
        return true;
      } catch (error) {
        console.error(`Failed to deploy commands to server ${guildName} (${guildId}):`, error);
        return false;
      }
    }

    console.log('Starting deployment to all servers...');
    let successCount = 0;
    let failCount = 0;

    for (const guild of client.guilds.cache.values()) {
      const success = await deployToGuild(guild.id, guild.name);
      if (success) successCount++;
      else failCount++;
    }

    console.log(`Deployment complete! Success: ${successCount}, Failed: ${failCount}`);

    // Thiết lập kiểm tra cooldown định kỳ mỗi giờ
    setInterval(() => {
      checkExpiredCooldowns(client);
    }, 3600000); // 1 giờ = 3600000ms

    // Chạy kiểm tra lần đầu khi bot khởi động
    checkExpiredCooldowns(client);

    // Set the bot's activity
    let status = [
      {
        name: `Gì cũng có mua hết tại J&D Store`,
        type: ActivityType.Streaming,
        url: 'https://www.youtube.com/watch?v=xVd8jNC_lTE',
      },
      {
        name: `Nạp game, Nitri,.. giá rẻ tại J&D Store`,
        type: ActivityType.Watching,
      },
      {
        name: `Mua ngay ở J&D Store đi chờ gì nữa`,
        type: ActivityType.Listening,
      },
    ];

    // Rotate activity every 20 seconds
    setInterval(() => {
      const randomIndex = Math.floor(Math.random() * status.length);
      client.user.setActivity(status[randomIndex]);
    }, 20000);
  },
};
