// server.js
const { EmbedBuilder } = require('discord.js');
const { T } = require('../../../plugins/i18n');
  const { GT } = require('../../../utils/guildI18n');
const { getGuildLanguage } = require('../../../utils/prisma');

module.exports = {
  name: 'server',
  description: 'Hiển thị thông tin về server',
  aliases: ['serverinfo', 'guild', 'guildinfo'],
  usage: '',
  examples: [''],
  cooldown: 5,
  permissions: {
    bot: ['SendMessages', 'EmbedLinks'],
    user: [], // Không yêu cầu quyền đặc biệt
  },

  async execute(message, args, client) {
    // Lấy ngôn ngữ của người dùng từ database
    let userLocale = await getGuildLanguage(message.guild.id);
    if (!userLocale) {
      userLocale = message.guild?.preferredLocale || client.config?.defaultLanguage || 'Vietnamese';
    }

    const guild = message.guild;

    // Tạo embed thông tin server
    const embed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle(await GT(message.guild?.id, userLocale, 'server.title'))
      .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
      .addFields([
        {
          name: await GT(message.guild?.id, userLocale, 'server.name'),
          value: guild.name,
          inline: true,
        },
        {
          name: await GT(message.guild?.id, userLocale, 'server.id'),
          value: guild.id,
          inline: true,
        },
        {
          name: await GT(message.guild?.id, userLocale, 'server.owner'),
          value: `<@${guild.ownerId}>`,
          inline: true,
        },
        {
          name: await GT(message.guild?.id, userLocale, 'server.members'),
          value: guild.memberCount.toString(),
          inline: true,
        },
        {
          name: await GT(message.guild?.id, userLocale, 'server.channels'),
          value: guild.channels.cache.size.toString(),
          inline: true,
        },
        {
          name: await GT(message.guild?.id, userLocale, 'server.roles'),
          value: guild.roles.cache.size.toString(),
          inline: true,
        },
        {
          name: await GT(message.guild?.id, userLocale, 'server.creation_date'),
          value: guild.createdAt.toLocaleDateString(),
          inline: true,
        },
        {
          name: await GT(message.guild?.id, userLocale, 'server.boost_level'),
          value: guild.premiumTier.toString(),
          inline: true,
        },
        {
          name: await GT(message.guild?.id, userLocale, 'server.boost_count'),
          value: guild.premiumSubscriptionCount.toString(),
          inline: true,
        },
      ])
      .setFooter({
        text: `${await GT(
          message.guild?.id,
          userLocale,
          'use_many.request_by'
        )} ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    return { embed };
  },
};
