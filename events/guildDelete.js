module.exports = {
  name: 'guildDelete',
  once: false,
  execute(guild) {
    console.log(`Bot was removed from server: ${guild.name} (${guild.id})`);
  },
};
