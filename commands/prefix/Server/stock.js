const { ButtonStyle, EmbedBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags } = require('discord.js');
const EmbedComponentsV2 = require('../../../utils/embedComponentsV2');
const { GT } = require('../../../utils/guildI18n');
const { getStockConfig } = require('../../../utils/prisma');

// Placeholder replacer
function replacePlaceholders(text, context) {
  if (!text) return text;
  
  const { user, guild, message } = context;
  const now = Math.floor(Date.now() / 1000);
  
  return text
    .replace(/\{user\}/g, user ? `<@${user.id}>` : '')
    .replace(/\{user\.tag\}/g, user?.tag || user?.username || '')
    .replace(/\{user\.name\}/g, user?.username || '')
    .replace(/\{user\.id\}/g, user?.id || '')
    .replace(/\{user\.avatar\}/g, user?.displayAvatarURL?.({ size: 256 }) || '')
    .replace(/\{guild\.name\}/g, guild?.name || '')
    .replace(/\{guild\.id\}/g, guild?.id || '')
    .replace(/\{guild\.memberCount\}/g, guild?.memberCount?.toString() || '0')
    .replace(/\{guild\.icon\}/g, guild?.iconURL?.({ size: 256 }) || '')
    .replace(/\{timestamp\}/g, now.toString())
    .replace(/\{timestamp:R\}/g, `<t:${now}:R>`)
    .replace(/\{timestamp:F\}/g, `<t:${now}:F>`)
    .replace(/\{timestamp:f\}/g, `<t:${now}:f>`)
    .replace(/\{timestamp:D\}/g, `<t:${now}:D>`)
    .replace(/\{timestamp:T\}/g, `<t:${now}:T>`)
    .replace(/\{date\}/g, new Date().toLocaleDateString('vi-VN'))
    .replace(/\{time\}/g, new Date().toLocaleTimeString('vi-VN'))
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
  description: 'Gửi embed stock với nhiều embeds',
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

    const config = await getStockConfig(guildId);

    if (!config || !config.enabled) {
      return {
        content: await GT(guildId, userLocale, 'stock.no_config') || '❌ Chưa có cấu hình stock! Vui lòng thiết lập qua web dashboard.',
      };
    }

    let embeds = [];
    let buttons = [];
    
    try {
      embeds = JSON.parse(config.embeds || '[]');
      buttons = JSON.parse(config.buttons || '[]');
    } catch (e) {
      console.error('Error parsing stock config:', e);
      return { content: '❌ Lỗi cấu hình stock!' };
    }

    if (embeds.length === 0) {
      return {
        content: await GT(guildId, userLocale, 'stock.no_embeds') || '❌ Chưa có embed nào! Vui lòng thêm qua web dashboard.',
      };
    }

    const context = {
      user: message.author,
      guild: message.guild,
      message: message,
    };

    // Send each embed with its own buttons
    for (let i = 0; i < embeds.length; i++) {
      const embedConfig = embeds[i];
      const embedButtons = embedConfig.buttons || []; // Buttons riêng của embed này
      
      try {
        if (embedConfig.type === 'componentsv2') {
          // Components V2 Mode
          const container = EmbedComponentsV2.createContainer();

          for (const section of (embedConfig.sections || [])) {
            switch (section.type) {
              case 'heading':
                const level = section.level || 2;
                const prefix = '#'.repeat(level) + ' ';
                container.addTextDisplay(prefix + replacePlaceholders(section.content, context));
                break;
              case 'text':
                container.addTextDisplay(replacePlaceholders(section.content, context));
                break;
              case 'separator':
                container.addSeparator({
                  divider: section.divider !== false,
                  spacing: section.spacing === 'large' ? 'Large' : 'Small',
                });
                break;
              case 'image':
                if (section.url) container.addImage(replacePlaceholders(section.url, context));
                break;
            }
          }

          if (embedConfig.footer) {
            container.addSeparator();
            container.addTextDisplay(replacePlaceholders(embedConfig.footer, context));
          }

          // Add buttons của embed này
          for (const btn of embedButtons) {
            if (btn.customId === 'ticket_create_buy' || btn.customId === 'ticket_create_support') {
              container.addButton(
                replacePlaceholders(btn.label, context),
                btn.customId,
                getButtonStyle(btn.style),
                { emoji: btn.emoji || undefined }
              );
            }
          }

          await message.channel.send(container.build());

        } else {
          // Regular Embed Mode
          const embed = new EmbedBuilder();

          if (embedConfig.color) embed.setColor(embedConfig.color);
          if (embedConfig.title) embed.setTitle(replacePlaceholders(embedConfig.title, context));
          if (embedConfig.description) embed.setDescription(replacePlaceholders(embedConfig.description, context));
          if (embedConfig.image) embed.setImage(replacePlaceholders(embedConfig.image, context));
          if (embedConfig.thumbnail) embed.setThumbnail(replacePlaceholders(embedConfig.thumbnail, context));
          if (embedConfig.footer) embed.setFooter({ text: replacePlaceholders(embedConfig.footer, context) });

          const payload = { embeds: [embed] };
          
          // Add buttons của embed này
          if (embedButtons.length > 0) {
            const buttonRow = new ActionRowBuilder();
            for (const btn of embedButtons) {
              if (btn.customId === 'ticket_create_buy' || btn.customId === 'ticket_create_support') {
                const button = new ButtonBuilder()
                  .setLabel(replacePlaceholders(btn.label, context))
                  .setCustomId(btn.customId)
                  .setStyle(getButtonStyle(btn.style));
                if (btn.emoji) button.setEmoji(btn.emoji);
                buttonRow.addComponents(button);
              }
            }
            if (buttonRow.components.length > 0) {
              payload.components = [buttonRow];
            }
          }

          await message.channel.send(payload);
        }
      } catch (err) {
        console.error(`Error sending embed ${i}:`, err);
      }
    }

    // Delete original message
    try {
      await message.delete();
    } catch (e) {}

    return null;
  },
};
