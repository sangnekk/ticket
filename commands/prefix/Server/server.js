const { GT } = require('../../../utils/guildI18n');
const { getGuildLanguage } = require('../../../utils/prisma');
const EmbedComponentsV2 = require('../../../utils/embedComponentsV2');

module.exports = {
  name: 'server',
  description: 'Hiển thị thông tin về server',
  aliases: ['serverinfo', 'guild', 'guildinfo'],
  usage: '',
  examples: [''],
  cooldown: 5,
  permissions: {
    bot: ['SendMessages', 'EmbedLinks'],
    user: [],
  },

  async execute(message, args, client) {
    let userLocale = await getGuildLanguage(message.guild.id);
    if (!userLocale) {
      userLocale = message.guild?.preferredLocale || client.config?.defaultLanguage || 'Vietnamese';
    }

    const guild = message.guild;

    const container = EmbedComponentsV2.createContainer();
    
    container.addTextDisplay(`## ${await GT(message.guild?.id, userLocale, 'server.title')}`);
    container.addSeparator({ divider: true });
    
    // Server info
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'server.name')}:** ${guild.name}`);
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'server.id')}:** \`${guild.id}\``);
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'server.owner')}:** <@${guild.ownerId}>`);
    
    container.addSeparator({ divider: true });
    
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'server.members')}:** ${guild.memberCount}`);
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'server.channels')}:** ${guild.channels.cache.size}`);
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'server.roles')}:** ${guild.roles.cache.size}`);
    
    container.addSeparator({ divider: true });
    
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'server.creation_date')}:** ${guild.createdAt.toLocaleDateString()}`);
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'server.boost_level')}:** ${guild.premiumTier}`);
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'server.boost_count')}:** ${guild.premiumSubscriptionCount}`);
    
    container.addTextDisplay(`-# ${await GT(message.guild?.id, userLocale, 'use_many.request_by')} ${message.author.tag} • <t:${Math.floor(Date.now() / 1000)}:f>`);

    return container.build();
  },
};
