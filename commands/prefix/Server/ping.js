const { EmbedBuilder } = require('discord.js');
const { T } = require('../../../plugins/i18n');
const { GT } = require('../../../utils/guildI18n');
const EmbedUtils = require('../../../utils/embedUtils');

module.exports = {
  name: 'ping',
  description: 'Kiểm tra độ trễ của bot',
  aliases: ['pong'],
  usage: '',
  examples: [''],
  cooldown: 10,
  permissions: {
    bot: ['SendMessages', 'EmbedLinks'],
    user: [], // Không yêu cầu quyền đặc biệt
  },

  async execute(message, args, client) {
    // Lấy ngôn ngữ của người dùng
    const userLocale =
      message.guild?.preferredLocale || client.config?.defaultLanguage || 'Vietnamese';

    // Tính toán độ trễ
    const botLatency = Date.now() - message.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    // Tạo embed ping sử dụng EmbedUtils
    const embed = EmbedUtils.ping(botLatency, apiLatency, userLocale, message.author);

    // Trả về kết quả để xử lý qua event
    return {
      embed,
      content: await GT(message.guild?.id, userLocale, 'ping.checking'),
      ephemeral: false, // Cho phép người khác nhìn thấy
    };
  },
};
