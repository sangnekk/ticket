const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const EmbedUtils = require('./embedUtils');
const EmbedComponentsV2 = require('./embedComponentsV2');

module.exports = {
  // Tạo embed chuẩn (deprecated - sử dụng EmbedUtils.create thay thế)
  createEmbed: ({
    title,
    description,
    color = config.embedColor,
    fields = [],
    thumbnail,
    image,
    footer,
  }) => {
    console.warn('createEmbed is deprecated. Use EmbedUtils.create instead.');
    return EmbedUtils.create({
      title,
      description,
      color,
      fields,
      thumbnail,
      image,
      footer,
      timestamp: true,
    });
  },

  // Check permissions
  checkPermissions: (member, permissions) => {
    const missingPermissions = member.permissions.missing(permissions);
    if (!missingPermissions.length) return null;
    return missingPermissions;
  },

  // Format milliseconds to time
  formatTime: ms => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    return {
      days,
      hours,
      minutes,
      seconds,
      toString: () => `${days}d ${hours}h ${minutes}m ${seconds}s`,
    };
  },

  // Random number trong khoảng
  randomNumber: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Format số với dấu phẩy
  formatNumber: num => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  // Format thời gian từ timestamp
  formatTimestamp: (timestamp, style = 'R') => {
    return `<t:${Math.floor(timestamp / 1000)}:${style}>`;
  },

  // Tạo progress bar
  createProgressBar: (current, max, length = 20) => {
    const percentage = Math.min(Math.max(current / max, 0), 1);
    const filled = Math.round(percentage * length);
    const empty = length - filled;

    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.round(percentage * 100)}%`;
  },

  // Kiểm tra URL hợp lệ
  isValidURL: string => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },

  // Truncate text
  truncateText: (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },

  // Escape markdown
  escapeMarkdown: text => {
    return text.replace(/[\\`*_~|]/g, '\\$&');
  },

  // Tạo code block
  codeBlock: (code, language = '') => {
    return `\`\`\`${language}\n${code}\n\`\`\``;
  },

  // Tạo inline code
  inlineCode: text => {
    return `\`${text}\``;
  },

  // Tạo mention
  mention: (type, id) => {
    const types = {
      user: '@',
      channel: '#',
      role: '@&',
      slash: '/',
    };
    return `<${types[type] || '@'}${id}>`;
  },

  // Parse mention
  parseMention: mention => {
    const match = mention.match(/<(@!?|@&|#)(\d+)>/);
    if (!match) return null;

    const [, type, id] = match;
    const types = {
      '@!': 'user',
      '@': 'user',
      '@&': 'role',
      '#': 'channel',
    };

    return {
      type: types[type],
      id: id,
    };
  },

  // Tạo embed từ object
  createEmbedFromObject: obj => {
    return EmbedUtils.create(obj);
  },

  // Tạo embed success
  createSuccessEmbed: (title, description, options = {}) => {
    return EmbedUtils.success(title, description, options);
  },

  // Tạo embed error
  createErrorEmbed: (title, description, options = {}) => {
    return EmbedUtils.error(title, description, options);
  },

  // Tạo embed warning
  createWarningEmbed: (title, description, options = {}) => {
    return EmbedUtils.warning(title, description, options);
  },

  // Tạo embed info
  createInfoEmbed: (title, description, options = {}) => {
    return EmbedUtils.info(title, description, options);
  },

  // Tạo embed loading
  createLoadingEmbed: (title, description, options = {}) => {
    return EmbedUtils.loading(title, description, options);
  },

  // ===== EMBED COMPONENTS V2 METHODS =====

  // Tạo embed builder v2
  createEmbedV2: (theme = 'default') => {
    return EmbedComponentsV2.createBuilder(theme);
  },

  // Tạo card component
  createCard: (theme = 'default') => {
    return EmbedComponentsV2.createCard(theme);
  },

  // Tạo pagination component
  createPagination: (items, itemsPerPage = 10, theme = 'default') => {
    return EmbedComponentsV2.createPagination(items, itemsPerPage, theme);
  },

  // Tạo interactive component
  createInteractive: (theme = 'default') => {
    return EmbedComponentsV2.createInteractive(theme);
  },

  // Quick methods cho embed v2
  quickSuccessV2: (title, description, theme = 'default') => {
    return EmbedComponentsV2.quickSuccess(title, description, theme);
  },

  quickErrorV2: (title, description, theme = 'default') => {
    return EmbedComponentsV2.quickError(title, description, theme);
  },

  quickWarningV2: (title, description, theme = 'default') => {
    return EmbedComponentsV2.quickWarning(title, description, theme);
  },

  quickInfoV2: (title, description, theme = 'default') => {
    return EmbedComponentsV2.quickInfo(title, description, theme);
  },

  quickLoadingV2: (title, description, theme = 'default') => {
    return EmbedComponentsV2.quickLoading(title, description, theme);
  },

  // Tạo user card
  createUserCard: (user, options = {}, theme = 'default') => {
    const card = EmbedComponentsV2.createCard(theme);
    return card.userCard(user, options);
  },

  // Tạo server card
  createServerCard: (guild, options = {}, theme = 'default') => {
    const card = EmbedComponentsV2.createCard(theme);
    return card.serverCard(guild, options);
  },

  // Tạo command card
  createCommandCard: (command, locale = 'Vietnamese', theme = 'default') => {
    const card = EmbedComponentsV2.createCard(theme);
    return card.commandCard(command, locale);
  },

  // Tạo confirmation dialog
  createConfirmation: (title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', theme = 'default') => {
    const interactive = EmbedComponentsV2.createInteractive(theme);
    return interactive.createConfirmation(title, description, confirmLabel, cancelLabel);
  },

  // Tạo settings panel
  createSettingsPanel: (settings, currentValues = {}, theme = 'default') => {
    const interactive = EmbedComponentsV2.createInteractive(theme);
    return interactive.createSettingsPanel(settings, currentValues);
  },

  // Tạo progress bar
  createProgressBar: (current, max, title = 'Progress', showPercentage = true, theme = 'default') => {
    const interactive = EmbedComponentsV2.createInteractive(theme);
    return interactive.createProgressBar(current, max, title, showPercentage);
  },

  // Tạo leaderboard
  createLeaderboard: (items, title = 'Leaderboard', formatter = null, theme = 'default') => {
    const interactive = EmbedComponentsV2.createInteractive(theme);
    return interactive.createLeaderboard(items, title, formatter);
  },

  // Tạo embed với animation
  createAnimatedEmbed: (title, description, animationType = 'loading', interval = 1000, theme = 'default') => {
    const builder = EmbedComponentsV2.createBuilder(theme);
    return builder
      .setTitle(title)
      .setDescription(description)
      .startAnimation(animationType, interval)
      .build();
  },

  // Tạo embed với buttons
  createEmbedWithButtons: (title, description, buttons, theme = 'default') => {
    const builder = EmbedComponentsV2.createBuilder(theme);
    builder.setTitle(title).setDescription(description);
    
    buttons.forEach(button => {
      builder.addButton(
        button.label,
        button.customId,
        button.style || 'Primary',
        button.options || {}
      );
    });

    return builder.build();
  },

  // Tạo embed với select menu
  createEmbedWithSelect: (title, description, selectMenu, theme = 'default') => {
    const builder = EmbedComponentsV2.createBuilder(theme);
    builder
      .setTitle(title)
      .setDescription(description)
      .addSelectMenu(
        selectMenu.customId,
        selectMenu.placeholder,
        selectMenu.options,
        selectMenu.minValues,
        selectMenu.maxValues
      );

    return builder.build();
  },

  // Tạo modal
  createModal: (title, customId, inputs, theme = 'default') => {
    const builder = EmbedComponentsV2.createBuilder(theme);
    return builder.addModal(title, customId, inputs);
  },

  // Utility methods cho embed v2
  getTheme: (themeName = 'default') => {
    return EmbedComponentsV2.themes[themeName] || EmbedComponentsV2.themes.default;
  },

  getAvailableThemes: () => {
    return Object.keys(EmbedComponentsV2.themes);
  },

  getAnimationTypes: () => {
    return Object.keys(EmbedComponentsV2.animations);
  },
};
