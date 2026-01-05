const { ButtonStyle } = require('discord.js');
const EmbedComponentsV2 = require('../../../utils/embedComponentsV2');
const { GT } = require('../../../utils/guildI18n');
const { getStockConfig } = require('../../../utils/prisma');

// Placeholder replacer
function replacePlaceholders(text, context) {
  if (!text) return text;
  
  const { user, guild, message } = context;
  const now = Math.floor(Date.now() / 1000);
  
  return text
    // User placeholders
    .replace(/\{user\}/g, user ? `<@${user.id}>` : '')
    .replace(/\{user\.tag\}/g, user?.tag || user?.username || '')
    .replace(/\{user\.name\}/g, user?.username || '')
    .replace(/\{user\.id\}/g, user?.id || '')
    .replace(/\{user\.avatar\}/g, user?.displayAvatarURL?.({ size: 256 }) || '')
    // Guild placeholders
    .replace(/\{guild\.name\}/g, guild?.name || '')
    .replace(/\{guild\.id\}/g, guild?.id || '')
    .replace(/\{guild\.memberCount\}/g, guild?.memberCount?.toString() || '0')
    .replace(/\{guild\.icon\}/g, guild?.iconURL?.({ size: 256 }) || '')
    // Time placeholders
    .replace(/\{timestamp\}/g, now.toString())
    .replace(/\{timestamp:R\}/g, `<t:${now}:R>`)
    .replace(/\{timestamp:F\}/g, `<t:${now}:F>`)
    .replace(/\{timestamp:f\}/g, `<t:${now}:f>`)
    .replace(/\{timestamp:D\}/g, `<t:${now}:D>`)
    .replace(/\{timestamp:T\}/g, `<t:${now}:T>`)
    .replace(/\{date\}/g, new Date().toLocaleDateString('vi-VN'))
    .replace(/\{time\}/g, new Date().toLocaleTimeString('vi-VN'))
    // Channel placeholder
    .replace(/\{channel\}/g, message?.channel ? `<#${message.channel.id}>` : '');
}

// Map style string to ButtonStyle enum
function getButtonStyle(style) {
  const styles = {
    primary: ButtonStyle.Primary,
    secondary: ButtonStyle.Secondary,
    success: ButtonStyle.Success,
    danger: ButtonStyle.Danger,
    link: ButtonStyle.Link,
  };
  return styles[style?.toLowerCase()] || ButtonStyle.Primary;
}

module.exports = {
  name: 'stock',
  description: 'Gửi embed stock với Components V2',
  aliases: ['st'],
  usage: '',
  examples: [''],
  cooldown: 5,
  permissions: {
    bot: ['SendMessages'],
    user: ['ManageMessages'],
  },

  async execute(message, args, client) {
    const guildId = message.guild.id;
    const userLocale = message.guild?.preferredLocale || client.config?.defaultLanguage || 'Vietnamese';

    // Lấy config stock từ database
    const config = await getStockConfig(guildId);

    if (!config || !config.enabled) {
      return {
        content: await GT(guildId, userLocale, 'stock.no_config') || '❌ Chưa có cấu hình stock! Vui lòng thiết lập qua web dashboard.',
      };
    }

    // Parse sections và buttons từ JSON
    let sections = [];
    let buttons = [];
    
    try {
      sections = JSON.parse(config.sections || '[]');
      buttons = JSON.parse(config.buttons || '[]');
    } catch (e) {
      console.error('Error parsing stock config:', e);
      return {
        content: '❌ Lỗi cấu hình stock! Vui lòng kiểm tra lại.',
      };
    }

    if (sections.length === 0) {
      return {
        content: await GT(guildId, userLocale, 'stock.no_sections') || '❌ Chưa có nội dung stock! Vui lòng thêm sections qua web dashboard.',
      };
    }

    // Context cho placeholders
    const context = {
      user: message.author,
      guild: message.guild,
      message: message,
    };

    // Tạo container với Components V2
    const container = EmbedComponentsV2.createContainer();

    // Render từng section
    for (const section of sections) {
      switch (section.type) {
        case 'heading':
          const level = section.level || 2;
          const headingPrefix = '#'.repeat(level) + ' ';
          container.addTextDisplay(headingPrefix + replacePlaceholders(section.content, context));
          break;

        case 'text':
          container.addTextDisplay(replacePlaceholders(section.content, context));
          break;

        case 'separator':
          container.addSeparator({
            divider: section.divider !== false,
            spacing: section.spacing || undefined,
          });
          break;

        case 'image':
          if (section.url) {
            container.addImage(replacePlaceholders(section.url, context));
          }
          break;

        default:
          // Unknown type, skip
          break;
      }
    }

    // Thêm footer nếu có
    if (config.footer) {
      container.addSeparator();
      container.addTextDisplay(replacePlaceholders(config.footer, context));
    }

    // Thêm buttons nếu có (ticket buttons với customId cố định)
    for (const btn of buttons) {
      // Chỉ cho phép ticket buttons
      if (btn.customId === 'ticket_create_buy' || btn.customId === 'ticket_create_support') {
        container.addButton(
          replacePlaceholders(btn.label, context),
          btn.customId,
          getButtonStyle(btn.style),
          {
            emoji: btn.emoji || undefined,
          }
        );
      }
    }

    // Build và gửi
    const payload = container.build();

    // Gửi message mới (không reply)
    await message.channel.send(payload);

    // Xóa message gốc
    try {
      await message.delete();
    } catch (e) {
      // Ignore nếu không xóa được
    }

    return null; // Không cần response từ commandResponse
  },
};
