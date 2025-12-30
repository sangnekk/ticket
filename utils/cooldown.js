const { Collection } = require('discord.js');

// Tạo một collection để lưu trữ thời gian cooldown của lệnh
const cooldowns = new Collection();

/**
 * Kiểm tra và loại bỏ các cooldown đã hết hạn
 * @param {Client} client - Discord client instance
 */
function checkExpiredCooldowns(client) {
  if (!cooldowns || cooldowns.size === 0) return;

  const now = Date.now();
  const expiredEntries = [];

  // Tìm các entry đã hết hạn
  cooldowns.forEach((timestamps, commandName) => {
    timestamps.forEach((expirationTime, userId) => {
      if (now > expirationTime) {
        // Nếu đã hết cooldown, thêm vào danh sách cần xóa
        if (!expiredEntries[commandName]) {
          expiredEntries[commandName] = [];
        }
        expiredEntries[commandName].push(userId);
      }
    });
  });

  // Xóa các entry đã hết hạn
  Object.keys(expiredEntries).forEach(commandName => {
    const userIds = expiredEntries[commandName];
    const timestamps = cooldowns.get(commandName);

    if (timestamps && userIds) {
      userIds.forEach(userId => {
        timestamps.delete(userId);
      });

      // Nếu lệnh không còn cooldown nào, xóa lệnh khỏi collection
      if (timestamps.size === 0) {
        cooldowns.delete(commandName);
      }
    }
  });

  console.log(`Đã xóa ${Object.values(expiredEntries).flat().length} cooldown hết hạn.`);
}

/**
 * Thiết lập cooldown cho một lệnh
 * @param {String} commandName - Tên lệnh
 * @param {String} userId - ID người dùng
 * @param {Number} cooldownAmount - Thời gian cooldown tính bằng giây
 */
function setCooldown(commandName, userId, cooldownAmount) {
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(commandName);
  const expirationTime = now + cooldownAmount * 1000;

  timestamps.set(userId, expirationTime);
}

/**
 * Kiểm tra xem người dùng có đang trong thời gian cooldown không
 * @param {String} commandName - Tên lệnh
 * @param {String} userId - ID người dùng
 * @returns {Number|Boolean} - Thời gian còn lại hoặc false nếu không có cooldown
 */
function checkCooldown(commandName, userId) {
  if (!cooldowns.has(commandName)) return false;

  const timestamps = cooldowns.get(commandName);
  if (!timestamps.has(userId)) return false;

  const expirationTime = timestamps.get(userId);
  const now = Date.now();

  if (now < expirationTime) {
    // Tính thời gian còn lại
    const timeLeft = (expirationTime - now) / 1000;
    return timeLeft;
  }

  return false;
}

module.exports = {
  cooldowns,
  checkExpiredCooldowns,
  setCooldown,
  checkCooldown,
};
