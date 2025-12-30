const { T } = require('../plugins/i18n');
const { getGuildTextOverride } = require('./prisma');

/**
 * Thay thế các placeholder dạng {key} trong text bằng params[key]
 * Ví dụ: "Xin chào {user}" + { user: "Sang" } => "Xin chào Sang"
 */
function formatTemplate(text, params = {}) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/{(\w+)}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : `{${key}}`
  );
}

/**
 * Guild Translation:
 * - Nếu có override trong DB cho (guildId, key) => dùng text trong DB (có thay placeholder)
 * - Nếu không có => fallback về i18n T(locale, key, params)
 *
 * @param {string|null} guildId
 * @param {string} locale
 * @param {string} key
 * @param {object} [params]
 * @returns {Promise<string>}
 */
async function GT(guildId, locale, key, params = {}) {
  try {
    if (guildId) {
      const override = await getGuildTextOverride(guildId, key);
      if (override) {
        return formatTemplate(override, params);
      }
    }
  } catch (e) {
    // Nếu lỗi khi đọc DB thì fallback về i18n bình thường
    console.error(
      `Lỗi khi xử lý GT cho guild ${guildId || 'N/A'}, key ${key}:`,
      e
    );
  }

  // Fallback về i18n file
  return T(locale, key, params);
}

module.exports = {
  GT,
  formatTemplate,
};


