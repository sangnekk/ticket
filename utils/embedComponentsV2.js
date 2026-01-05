const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  FileBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder
} = require('discord.js');

const SeparatorSpacingSize = {
  Small: 'Small',
  Large: 'Large',
};

/**
 * EmbedComponentsV2 - Wrapper class để làm việc với Discord Components V2
 * Cung cấp các helper methods và patterns phổ biến
 */
class EmbedComponentsV2 {
  
  // ============================================
  // THEME SYSTEM
  // ============================================
  static themes = {
    default: {
      emojis: {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        loading: '⏳',
        user: '👤',
        server: '🏠',
        settings: '⚙️',
        star: '⭐',
        crown: '👑',
        fire: '🔥',
        rocket: '🚀',
      }
    },
    dark: {
      emojis: {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        loading: '⏳',
        user: '👤',
        server: '🏠',
        settings: '⚙️',
        star: '⭐',
        crown: '👑',
        fire: '🔥',
        rocket: '🚀',
      }
    }
  };

  // ============================================
  // CONTAINER WRAPPER
  // ============================================
  static createContainer() {
    return new ComponentsV2ContainerWrapper();
  }

  // ============================================
  // QUICK BUILDERS
  // ============================================
  static createTextDisplay(content = '') {
    return new TextDisplayBuilder().setContent(content);
  }

  static createSeparator() {
    return new SeparatorBuilder();
  }

  static createSection() {
    return new SectionBuilder();
  }

  static createMediaGallery() {
    if (!MediaGalleryBuilder) {
      console.warn('MediaGalleryBuilder không khả dụng trong phiên bản discord.js này');
      return null;
    }
    return new MediaGalleryBuilder();
  }

  static createMediaGalleryItem(url) {
    if (!MediaGalleryItemBuilder) {
      console.warn('MediaGalleryItemBuilder không khả dụng trong phiên bản discord.js này');
      return null;
    }
    return new MediaGalleryItemBuilder().setURL(url);
  }

  static createFile(url) {
    return new FileBuilder().setURL(url);
  }

  // ============================================
  // QUICK MESSAGE TEMPLATES
  // ============================================
  static quickSuccess(title, description, options = {}) {
    const container = new ComponentsV2ContainerWrapper();
    
    container.addTextDisplay(`${this.themes.default.emojis.success} **${title}**`);
    if (description) {
      container.addTextDisplay(description);
    }
    
    if (options.buttons) {
      options.buttons.forEach(btn => {
        container.addButton(btn.label, btn.customId, btn.style || ButtonStyle.Primary);
      });
    }
    
    return container.build();
  }

  static quickError(title, description, options = {}) {
    const container = new ComponentsV2ContainerWrapper();
    
    container.addTextDisplay(`${this.themes.default.emojis.error} **${title}**`);
    if (description) {
      container.addTextDisplay(description);
    }
    
    if (options.buttons) {
      options.buttons.forEach(btn => {
        container.addButton(btn.label, btn.customId, btn.style || ButtonStyle.Danger);
      });
    }
    
    return container.build();
  }

  static quickWarning(title, description, options = {}) {
    const container = new ComponentsV2ContainerWrapper();
    
    container.addTextDisplay(`${this.themes.default.emojis.warning} **${title}**`);
    if (description) {
      container.addTextDisplay(description);
    }
    
    if (options.buttons) {
      options.buttons.forEach(btn => {
        container.addButton(btn.label, btn.customId, btn.style || ButtonStyle.Secondary);
      });
    }
    
    return container.build();
  }

  static quickInfo(title, description, options = {}) {
    const container = new ComponentsV2ContainerWrapper();
    
    container.addTextDisplay(`${this.themes.default.emojis.info} **${title}**`);
    if (description) {
      container.addTextDisplay(description);
    }
    
    if (options.buttons) {
      options.buttons.forEach(btn => {
        container.addButton(btn.label, btn.customId, btn.style || ButtonStyle.Primary);
      });
    }
    
    return container.build();
  }

  // ============================================
  // USER CARD TEMPLATE
  // ============================================
  static createUserCard(user, options = {}) {
    const container = new ComponentsV2ContainerWrapper();
    
    container.addTextDisplay(`## ${this.themes.default.emojis.user} ${user.tag || user.username}`);
    
    if (options.showId !== false) {
      container.addTextDisplay(`**ID:** \`${user.id}\``);
    }
    
    if (user.createdAt) {
      container.addTextDisplay(`**Created:** <t:${Math.floor(user.createdAt.getTime() / 1000)}:R>`);
    }
    
    if (options.avatar && user.displayAvatarURL) {
      const avatarUrl = user.displayAvatarURL({ size: 256 });
      // Note: Avatar cần được xử lý như attachment
    }
    
    if (options.buttons) {
      options.buttons.forEach(btn => {
        container.addButton(btn.label, btn.customId, btn.style || ButtonStyle.Primary, btn.options);
      });
    }
    
    return container.build();
  }

  // ============================================
  // SERVER CARD TEMPLATE
  // ============================================
  static createServerCard(guild, options = {}) {
    const container = new ComponentsV2ContainerWrapper();
    
    container.addTextDisplay(`## ${this.themes.default.emojis.server} ${guild.name}`);
    
    if (guild.description) {
      container.addTextDisplay(guild.description);
    }
    
    container.addSeparator();
    
    const sections = [];
    
    if (options.showMembers !== false) {
      sections.push(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**Members:** ${guild.memberCount}`)
          )
      );
    }
    
    if (options.showChannels !== false && guild.channels) {
      sections.push(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**Channels:** ${guild.channels.cache.size}`)
          )
      );
    }
    
    if (options.showOwner !== false) {
      sections.push(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`**Owner:** <@${guild.ownerId}>`)
          )
      );
    }
    
    sections.forEach(section => container.addSection(section));
    
    if (options.buttons) {
      options.buttons.forEach(btn => {
        container.addButton(btn.label, btn.customId, btn.style || ButtonStyle.Primary, btn.options);
      });
    }
    
    return container.build();
  }

  // ============================================
  // PAGINATION TEMPLATE
  // ============================================
  static createPagination(items, currentPage = 1, itemsPerPage = 10, options = {}) {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);

    const container = new ComponentsV2ContainerWrapper();
    
    if (options.title) {
      container.addTextDisplay(`## ${options.title}`);
      container.addSeparator();
    }
    
    // Hiển thị items
    if (options.formatter) {
      currentItems.forEach((item, index) => {
        container.addTextDisplay(options.formatter(item, startIndex + index));
      });
    } else {
      currentItems.forEach((item, index) => {
        container.addTextDisplay(`${startIndex + index + 1}. ${item}`);
      });
    }
    
    container.addSeparator();
    container.addTextDisplay(`*Page ${currentPage} of ${totalPages} • ${items.length} total items*`);
    
    // Pagination buttons
    if (totalPages > 1) {
      if (currentPage > 1) {
        container.addButton('◀️ Previous', `page_${currentPage - 1}`, ButtonStyle.Secondary);
      }
      
      container.addButton(`${currentPage}/${totalPages}`, 'page_current', ButtonStyle.Primary, {
        disabled: true
      });
      
      if (currentPage < totalPages) {
        container.addButton('Next ▶️', `page_${currentPage + 1}`, ButtonStyle.Secondary);
      }
    }
    
    return container.build();
  }

  // ============================================
  // CONFIRMATION DIALOG
  // ============================================
  static createConfirmation(title, description, options = {}) {
    const container = new ComponentsV2ContainerWrapper();
    
    container.addTextDisplay(`## ${this.themes.default.emojis.warning} ${title}`);
    if (description) {
      container.addTextDisplay(description);
    }
    
    container.addSeparator();
    
    container.addButton(
      options.confirmLabel || 'Confirm',
      options.confirmId || 'confirm_yes',
      ButtonStyle.Success
    );
    
    container.addButton(
      options.cancelLabel || 'Cancel',
      options.cancelId || 'confirm_no',
      ButtonStyle.Danger
    );
    
    if (options.ephemeral) {
      container.setEphemeral(true);
    }
    
    return container.build();
  }

  // ============================================
  // MEDIA GALLERY TEMPLATE
  // ============================================
  static createMediaGallery(title, images, options = {}) {
    const container = new ComponentsV2ContainerWrapper();
    
    if (title) {
      container.addTextDisplay(`## ${title}`);
    }
    
    if (MediaGalleryBuilder && MediaGalleryItemBuilder) {
      const gallery = new MediaGalleryBuilder();
      images.forEach(imageUrl => {
        gallery.addItems(new MediaGalleryItemBuilder().setURL(imageUrl));
      });
      container.addMediaGallery(gallery);
    } else {
      // Fallback: hiển thị images dưới dạng links
      images.forEach(imageUrl => {
        container.addTextDisplay(`[​](${imageUrl})`);
      });
    }
    
    if (options.caption) {
      container.addTextDisplay(`*${options.caption}*`);
    }
    
    return container.build();
  }

  // ============================================
  // LEADERBOARD TEMPLATE
  // ============================================
  static createLeaderboard(items, title = 'Leaderboard', formatter = null) {
    const container = new ComponentsV2ContainerWrapper();
    
    container.addTextDisplay(`## ${this.themes.default.emojis.crown} ${title}`);
    container.addSeparator();
    
    items.forEach((item, index) => {
      let emoji = '';
      if (index === 0) emoji = '🥇';
      else if (index === 1) emoji = '🥈';
      else if (index === 2) emoji = '🥉';
      else emoji = `${index + 1}.`;
      
      const text = formatter ? formatter(item, index) : item.toString();
      container.addTextDisplay(`${emoji} ${text}`);
    });
    
    return container.build();
  }
}

// ============================================
// CONTAINER WRAPPER CLASS
// ============================================
class ComponentsV2ContainerWrapper {
  constructor() {
    this.containerBuilder = new ContainerBuilder();
    this.currentButtonRow = null;
    this.files = [];
    this.ephemeral = false;
  }

  addTextDisplay(contentOrBuilder) {
    const builder =
      contentOrBuilder instanceof TextDisplayBuilder
        ? contentOrBuilder
        : new TextDisplayBuilder().setContent(contentOrBuilder);

    this.containerBuilder.addTextDisplayComponents(builder);
    return this;
  }

  addSeparator(options = {}) {
    const separator =
      options instanceof SeparatorBuilder ? options : new SeparatorBuilder();

    if (!(options instanceof SeparatorBuilder)) {
      if (options.spacing) separator.setSpacing(options.spacing);
      if (options.divider) separator.setDivider(options.divider);
    }

    this.containerBuilder.addSeparatorComponents(separator);
    return this;
  }

  addSection(sectionBuilder) {
    this.containerBuilder.addSectionComponents(sectionBuilder);
    return this;
  }

  addMediaGallery(galleryBuilder) {
    this.containerBuilder.addMediaGalleryComponents(galleryBuilder);
    return this;
  }

  // Helper method để thêm image URL trực tiếp dùng MediaGallery
  addImage(imageUrl) {
    if (!imageUrl) return this;
    
    try {
      const gallery = new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(imageUrl)
      );
      this.containerBuilder.addMediaGalleryComponents(gallery);
    } catch (err) {
      console.error('Error adding image to container:', err);
    }
    return this;
  }

  // Helper method để thêm image dùng FileBuilder (unfurled)
  addUnfurledImage(imageUrl) {
    if (!imageUrl) return this;
    
    try {
      const file = new FileBuilder().setURL(imageUrl);
      this.containerBuilder.addFileComponents(file);
    } catch (err) {
      console.error('Error adding unfurled image to container:', err);
    }
    return this;
  }

  addFile(fileBuilder) {
    this.containerBuilder.addFileComponents(fileBuilder);
    return this;
  }

  addButton(label, customId, style = ButtonStyle.Primary, options = {}) {
    const button = new ButtonBuilder().setLabel(label).setStyle(style);

    if (options.url) {
      button.setURL(options.url).setStyle(ButtonStyle.Link);
    } else if (customId) {
      button.setCustomId(customId);
    }

    if (options.emoji) button.setEmoji(options.emoji);
    if (options.disabled) button.setDisabled(options.disabled);

    const row = this._getOrCreateButtonRow();
    row.addComponents(button);
    return this;
  }

  addSelectMenu(customId, placeholder, options, config = {}) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .addOptions(options);

    if (config.minValues) selectMenu.setMinValues(config.minValues);
    if (config.maxValues) selectMenu.setMaxValues(config.maxValues);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    this.containerBuilder.addActionRowComponents(row);
    this.currentButtonRow = null;
    return this;
  }

  addAttachment(attachment) {
    this.files.push(attachment);
    return this;
  }

  addActionRowComponents(...actionRows) {
    actionRows
      .filter(row => row instanceof ActionRowBuilder)
      .forEach(row => this.containerBuilder.addActionRowComponents(row));
    this.currentButtonRow = null;
    return this;
  }

  _getOrCreateButtonRow() {
    if (!this.currentButtonRow || this.currentButtonRow.components.length >= 5) {
      this.currentButtonRow = new ActionRowBuilder();
      this.containerBuilder.addActionRowComponents(this.currentButtonRow);
    }
    return this.currentButtonRow;
  }

  setEphemeral(value = true) {
    this.ephemeral = value;
    return this;
  }

  build() {
    const payload = {
      components: [this.containerBuilder],
      flags: MessageFlags.IsComponentsV2,
    };

    if (this.files.length > 0) {
      payload.files = this.files;
    }

    if (this.ephemeral) {
      payload.flags |= MessageFlags.Ephemeral;
    }

    return payload;
  }
}

EmbedComponentsV2.ContainerWrapper = ComponentsV2ContainerWrapper;
EmbedComponentsV2.SeparatorSpacingSize = SeparatorSpacingSize;

module.exports = EmbedComponentsV2;