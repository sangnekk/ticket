const { T, Language } = require('../../../plugins/i18n');
const { getGuildLanguage, setGuildLanguage, getGuildPrefix } = require('../../../utils/prisma');
const EmbedComponentsV2 = require('../../../utils/embedComponentsV2');

module.exports = {
  name: 'language',
  aliases: ['lang', 'ngonngu'],
  description: 'Xem hoặc thay đổi ngôn ngữ của bot trong server',
  usage: 'language [ngôn_ngữ]',
  examples: ['language', 'language Vietnamese', 'language English'],
  cooldown: 5,
  permissions: {
    bot: ['SendMessages', 'EmbedLinks'],
    user: ['ManageGuild'],
  },
  async execute(message, args, client) {
    let currentLocale = await getGuildLanguage(message.guild.id);
    if (!currentLocale) {
      currentLocale = client.config?.defaultLanguage || 'Vietnamese';
    }

    const currentPrefix = (await getGuildPrefix(message.guild.id)) || '!';

    // Nếu không có tham số, hiển thị ngôn ngữ hiện tại
    if (!args.length) {
      const container = EmbedComponentsV2.createContainer();
      
      container.addTextDisplay(`## 🌐 ${T(currentLocale, 'desc.language')}`);
      container.addSeparator({ divider: true });
      container.addTextDisplay(T(currentLocale, 'success.language', { lang: currentLocale }));
      container.addTextDisplay(`**${T(currentLocale, 'language.available')}:**\n${Object.keys(Language).join(', ')}`);
      container.addSeparator({ divider: true });
      container.addTextDisplay(`-# ${T(currentLocale, 'language.change_guide', { prefix: currentPrefix })}`);

      return container.build();
    }

    // Nếu có tham số, kiểm tra và thay đổi ngôn ngữ
    const newLanguage = args[0];

    if (!Object.keys(Language).includes(newLanguage)) {
      return {
        content: T(currentLocale, 'error.language', {
          lang: Object.keys(Language).join(', '),
        }),
        flags: 64,
      };
    }

    try {
      await setGuildLanguage(message.guild.id, newLanguage);

      const container = EmbedComponentsV2.createContainer();
      
      container.addTextDisplay(`## ✅ ${T(newLanguage, 'success_general')}`);
      container.addSeparator({ divider: true });
      container.addTextDisplay(T(newLanguage, 'language.changed', {
        old: currentLocale,
        new: newLanguage,
      }));
      container.addTextDisplay(`-# ${message.author.tag} • <t:${Math.floor(Date.now() / 1000)}:f>`);

      return container.build();
    } catch (error) {
      console.error('Lỗi khi thay đổi ngôn ngữ:', error);
      return {
        content: T(currentLocale, 'error.database', { error: error.message }),
        flags: 64,
      };
    }
  },
};
