const { MessageFlags } = require('discord-api-types/v10');

/**
 * Chuyển đổi từ object options có thuộc tính ephemeral sang dùng flags
 * @param {Object} options - Object chứa các tùy chọn reply
 * @returns {Object} - Object mới có flags thay vì ephemeral
 */
function convertEphemeralToFlags(options) {
  // Nếu không có options, trả về object rỗng
  if (!options) return {};

  // Clone options để không làm thay đổi object gốc
  const newOptions = { ...options };

  // Nếu có thuộc tính ephemeral
  if (newOptions.ephemeral !== undefined) {
    // Nếu ephemeral là true, thêm flags
    if (newOptions.ephemeral === true) {
      newOptions.flags = newOptions.flags || 0;
      newOptions.flags |= MessageFlags.Ephemeral;
    }

    // Xóa thuộc tính ephemeral
    delete newOptions.ephemeral;
  }

  return newOptions;
}

module.exports = {
  MessageFlags,
  convertEphemeralToFlags,
};
