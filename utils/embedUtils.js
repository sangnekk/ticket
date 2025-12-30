const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');
const { T } = require('../plugins/i18n');

/**
 * Embed Utils - Thống nhất và tiện ích cho việc tạo embed
 */
class EmbedUtils {
  // Màu sắc chuẩn
  static colors = {
    primary: '#3498db',
    success: '#00ff00',
    error: '#ff0000',
    warning: '#ffa500',
    info: '#00bfff',
    secondary: '#95a5a6',
    purple: '#9b59b6',
    orange: '#e67e22',
    red: '#e74c3c',
    green: '#2ecc71',
    blue: '#3498db',
    yellow: '#f1c40f',
    pink: '#e91e63',
    cyan: '#1abc9c',
    dark: '#2c3e50',
    light: '#ecf0f1',
  };

  // Emoji chuẩn
  static emojis = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳',
    check: '✔️',
    cross: '✖️',
    star: '⭐',
    heart: '❤️',
    fire: '🔥',
    rocket: '🚀',
    crown: '👑',
    shield: '🛡️',
    gear: '⚙️',
    lock: '🔒',
    unlock: '🔓',
    plus: '➕',
    minus: '➖',
    arrow_right: '➡️',
    arrow_left: '⬅️',
    refresh: '🔄',
    trash: '🗑️',
    edit: '✏️',
    copy: '📋',
    download: '📥',
    upload: '📤',
    search: '🔍',
    settings: '⚙️',
    user: '👤',
    server: '🏠',
    channel: '📍',
    time: '⏰',
    command: '📝',
    bot: '🤖',
    admin: '👑',
    moderator: '🛡️',
    member: '👥',
    online: '🟢',
    offline: '🔴',
    idle: '🟡',
    dnd: '🔴',
  };

  /**
   * Tạo embed cơ bản với các tùy chọn
   * @param {Object} options - Các tùy chọn cho embed
   * @returns {EmbedBuilder}
   */
  static create(options = {}) {
    const {
      title,
      description,
      color = config.embedColor,
      fields = [],
      thumbnail,
      image,
      footer,
      author,
      url,
      timestamp = true,
    } = options;

    const embed = new EmbedBuilder();

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (color) embed.setColor(color);
    if (fields.length) embed.addFields(fields);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (image) embed.setImage(image);
    if (footer) embed.setFooter(footer);
    if (author) embed.setAuthor(author);
    if (url) embed.setURL(url);
    if (timestamp) embed.setTimestamp();

    return embed;
  }

  /**
   * Tạo embed thành công
   * @param {string} title - Tiêu đề
   * @param {string} description - Mô tả
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {EmbedBuilder}
   */
  static success(title, description, options = {}) {
    return this.create({
      title: `${this.emojis.success} ${title}`,
      description,
      color: this.colors.success,
      ...options,
    });
  }

  /**
   * Tạo embed lỗi
   * @param {string} title - Tiêu đề
   * @param {string} description - Mô tả
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {EmbedBuilder}
   */
  static error(title, description, options = {}) {
    return this.create({
      title: `${this.emojis.error} ${title}`,
      description,
      color: this.colors.error,
      ...options,
    });
  }

  /**
   * Tạo embed cảnh báo
   * @param {string} title - Tiêu đề
   * @param {string} description - Mô tả
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {EmbedBuilder}
   */
  static warning(title, description, options = {}) {
    return this.create({
      title: `${this.emojis.warning} ${title}`,
      description,
      color: this.colors.warning,
      ...options,
    });
  }

  /**
   * Tạo embed thông tin
   * @param {string} title - Tiêu đề
   * @param {string} description - Mô tả
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {EmbedBuilder}
   */
  static info(title, description, options = {}) {
    return this.create({
      title: `${this.emojis.info} ${title}`,
      description,
      color: this.colors.info,
      ...options,
    });
  }

  /**
   * Tạo embed loading
   * @param {string} title - Tiêu đề
   * @param {string} description - Mô tả
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {EmbedBuilder}
   */
  static loading(title, description, options = {}) {
    return this.create({
      title: `${this.emojis.loading} ${title}`,
      description,
      color: this.colors.secondary,
      ...options,
    });
  }

  /**
   * Tạo embed với footer chuẩn
   * @param {Object} options - Các tùy chọn cho embed
   * @param {Object} user - User object để tạo footer
   * @param {string} locale - Ngôn ngữ
   * @returns {EmbedBuilder}
   */
  static withFooter(options = {}, user, locale = 'Vietnamese') {
    const embed = this.create(options);

    if (user) {
      embed.setFooter({
        text: `${T(locale, 'use_many.request_by')} ${user.tag || user.username}`,
        iconURL: user.displayAvatarURL ? user.displayAvatarURL() : user.avatarURL,
      });
    }

    return embed;
  }

  /**
   * Tạo embed log cho command
   * @param {Object} commandData - Dữ liệu command
   * @param {boolean} isError - Có phải lỗi không
   * @param {string} type - Loại command (prefix/slash)
   * @returns {EmbedBuilder}
   */
  static commandLog(commandData, isError = false, type = 'prefix') {
    const { user, command, channel, guild, time, error, options } = commandData;

    const embed = this.create({
      title: `🔍 ${type === 'slash' ? 'Slash' : 'Prefix'} Command Log`,
      color: isError ? this.colors.error : this.colors.success,
      fields: [
        {
          name: `${this.emojis.user} User`,
          value: `${user.tag} (${user.id})`,
          inline: true,
        },
        {
          name: `${this.emojis.command} Command`,
          value: type === 'slash' ? `/${command}` : command,
          inline: true,
        },
        {
          name: `${this.emojis.channel} Channel`,
          value: `${channel.name} (${channel.id})`,
          inline: true,
        },
        {
          name: `${this.emojis.server} Server`,
          value: `${guild.name} (${guild.id})`,
          inline: true,
        },
        {
          name: `${this.emojis.time} Time`,
          value: time || new Date().toLocaleString(),
          inline: true,
        },
      ],
      timestamp: true,
    });

    // Thêm options cho slash command
    if (type === 'slash' && options && options.length > 0) {
      const optionsText = options
        .map(option => {
          if (option.type === 1) {
            // SUB_COMMAND
            return `**${option.name}**`;
          } else if (option.type === 2) {
            // SUB_COMMAND_GROUP
            return `**${option.name}** (group)`;
          } else {
            return `**${option.name}**: ${option.value}`;
          }
        })
        .join('\n');

      embed.addFields({
        name: `${this.emojis.gear} Options`,
        value: optionsText || 'None',
        inline: false,
      });
    }

    // Thêm thông tin lỗi nếu có
    if (isError && error) {
      embed.addFields({
        name: `${this.emojis.error} Error`,
        value: error.message || 'Unknown error',
        inline: false,
      });
    }

    return embed;
  }

  /**
   * Tạo embed help cho command
   * @param {Object} command - Command object
   * @param {string} locale - Ngôn ngữ
   * @param {Object} user - User object
   * @returns {EmbedBuilder}
   */
  static commandHelp(command, locale = 'Vietnamese', user) {
    const embed = this.create({
      title: `${this.emojis.info} ${command.name}`,
      description: command.description || T(locale, 'help.no_description'),
      color: this.colors.info,
      fields: [],
    });

    // Thêm usage nếu có
    if (command.usage) {
      embed.addFields({
        name: `${this.emojis.command} Usage`,
        value: `\`${command.usage}\``,
        inline: false,
      });
    }

    // Thêm examples nếu có
    if (command.examples && command.examples.length > 0) {
      embed.addFields({
        name: `${this.emojis.star} Examples`,
        value: command.examples.map(ex => `\`${ex}\``).join('\n'),
        inline: false,
      });
    }

    // Thêm aliases nếu có
    if (command.aliases && command.aliases.length > 0) {
      embed.addFields({
        name: `${this.emojis.copy} Aliases`,
        value: command.aliases.map(alias => `\`${alias}\``).join(', '),
        inline: true,
      });
    }

    // Thêm cooldown nếu có
    if (command.cooldown) {
      embed.addFields({
        name: `${this.emojis.time} Cooldown`,
        value: `${command.cooldown}s`,
        inline: true,
      });
    }

    // Thêm permissions nếu có
    if (command.permissions) {
      const permissions = [];
      if (command.permissions.user && command.permissions.user.length > 0) {
        permissions.push(`**User**: ${command.permissions.user.join(', ')}`);
      }
      if (command.permissions.bot && command.permissions.bot.length > 0) {
        permissions.push(`**Bot**: ${command.permissions.bot.join(', ')}`);
      }

      if (permissions.length > 0) {
        embed.addFields({
          name: `${this.emojis.shield} Permissions`,
          value: permissions.join('\n'),
          inline: false,
        });
      }
    }

    if (user) {
      embed.setFooter({
        text: `${T(locale, 'use_many.request_by')} ${user.tag}`,
        iconURL: user.displayAvatarURL(),
      });
    }

    return embed;
  }

  /**
   * Tạo embed ping
   * @param {number} botLatency - Độ trễ bot
   * @param {number} apiLatency - Độ trễ API
   * @param {string} locale - Ngôn ngữ
   * @param {Object} user - User object
   * @returns {EmbedBuilder}
   */
  static ping(botLatency, apiLatency, locale = 'Vietnamese', user) {
    const botLatencySign = botLatency < 600 ? '+' : '-';
    const apiLatencySign = apiLatency < 500 ? '+' : '-';
    const color = botLatency < 600 ? this.colors.success : this.colors.error;

    const embed = this.create({
      title: `${this.emojis.rocket} Pong!`,
      color,
      fields: [
        {
          name: T(locale, 'ping.bot_latency'),
          value: `\`\`\`diff\n${botLatencySign} ${botLatency}ms\n\`\`\``,
          inline: true,
        },
        {
          name: T(locale, 'ping.api_latency'),
          value: `\`\`\`diff\n${apiLatencySign} ${apiLatency}ms\n\`\`\``,
          inline: true,
        },
      ],
    });

    if (user) {
      embed.setFooter({
        text: `${T(locale, 'use_many.request_by')} ${user.username}`,
        iconURL: user.displayAvatarURL(),
      });
    }

    return embed;
  }

  /**
   * Tạo embed server info
   * @param {Object} guild - Guild object
   * @param {string} locale - Ngôn ngữ
   * @param {Object} user - User object
   * @returns {EmbedBuilder}
   */
  static serverInfo(guild, locale = 'Vietnamese', user) {
    const embed = this.create({
      title: `${this.emojis.server} ${guild.name}`,
      description: guild.description || T(locale, 'server.no_description'),
      color: this.colors.primary,
      thumbnail: guild.iconURL(),
      fields: [
        {
          name: `${this.emojis.user} Members`,
          value: `${guild.memberCount}`,
          inline: true,
        },
        {
          name: `${this.emojis.channel} Channels`,
          value: `${guild.channels.cache.size}`,
          inline: true,
        },
        {
          name: `${this.emojis.crown} Owner`,
          value: `<@${guild.ownerId}>`,
          inline: true,
        },
        {
          name: `${this.emojis.time} Created`,
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        {
          name: `${this.emojis.gear} Features`,
          value: guild.features.length > 0 ? guild.features.join(', ') : 'None',
          inline: false,
        },
      ],
    });

    if (user) {
      embed.setFooter({
        text: `${T(locale, 'use_many.request_by')} ${user.tag}`,
        iconURL: user.displayAvatarURL(),
      });
    }

    return embed;
  }

  /**
   * Tạo buttons chuẩn
   * @param {Array} buttons - Mảng các button config
   * @returns {ActionRowBuilder}
   */
  static createButtons(buttons) {
    const row = new ActionRowBuilder();

    buttons.forEach(button => {
      const { label, customId, style = ButtonStyle.Primary, emoji, disabled = false, url } = button;

      const buttonBuilder = new ButtonBuilder().setLabel(label).setDisabled(disabled);

      if (url) {
        buttonBuilder.setURL(url);
      } else {
        buttonBuilder.setCustomId(customId);
        buttonBuilder.setStyle(style);
      }

      if (emoji) {
        buttonBuilder.setEmoji(emoji);
      }

      row.addComponents(buttonBuilder);
    });

    return row;
  }

  /**
   * Tạo embed với pagination
   * @param {Array} items - Mảng các items
   * @param {number} page - Trang hiện tại
   * @param {number} itemsPerPage - Số items mỗi trang
   * @param {Function} formatter - Hàm format item
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {Object} - {embed, components, currentPage, totalPages}
   */
  static paginate(items, page = 1, itemsPerPage = 10, formatter, options = {}) {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);

    const embed = this.create({
      title: options.title || 'Paginated Results',
      description: currentItems.map(formatter).join('\n'),
      color: options.color || this.colors.primary,
      footer: {
        text: `Page ${page} of ${totalPages} • ${items.length} total items`,
      },
    });

    const components = [];
    if (totalPages > 1) {
      const buttons = [];

      if (page > 1) {
        buttons.push({
          label: 'Previous',
          customId: `page_${page - 1}`,
          style: ButtonStyle.Secondary,
          emoji: this.emojis.arrow_left,
        });
      }

      if (page < totalPages) {
        buttons.push({
          label: 'Next',
          customId: `page_${page + 1}`,
          style: ButtonStyle.Secondary,
          emoji: this.emojis.arrow_right,
        });
      }

      if (buttons.length > 0) {
        components.push(this.createButtons(buttons));
      }
    }

    return {
      embed,
      components,
      currentPage: page,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }
}

module.exports = EmbedUtils;
