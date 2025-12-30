const { deployCommands, getExistingCommands } = require('../deploy.js');

module.exports = {
  name: 'guildCreate',
  once: false,
  async execute(guild) {
    console.log(`Bot was added to new server: ${guild.name} (${guild.id})`);
    try {
      // Logic cải tiến: Kiểm tra xem đã có commands chưa
      const commands = await getExistingCommands(guild.id);
      if (commands.length === 0) {
        // Nếu chưa có commands, deploy mới
        await deployCommands([guild.id]);
        console.log(`Successfully deployed commands to new server: ${guild.name}`);
      } else {
        console.log(`Commands already exist on server ${guild.name}, skipping deployment`);
      }
    } catch (error) {
      console.error(`Failed to deploy commands to new server ${guild.name}:`, error);
    }
  },
};
