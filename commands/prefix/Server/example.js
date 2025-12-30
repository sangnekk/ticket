const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { T } = require('../../../plugins/i18n');
const { GT } = require('../../../utils/guildI18n');
const { getGuildLanguage } = require('../../../utils/prisma');
const EmbedComponentsV2 = require('../../../utils/embedComponentsV2');

module.exports = {
  name: 'example',
  description: 'Ví dụ về lệnh sử dụng đầy đủ tính năng của hệ thống',
  aliases: ['ex', 'demo'],
  usage: '[tham_số_1] [tham_số_2]',
  examples: ['', 'hello', 'hello world'],
  cooldown: 5,
  category: 'Server',
  permissions: {
    bot: ['SendMessages', 'EmbedLinks'],
    user: ['ManageMessages'],
  },

  async execute(message, args, client) {
    let userLocale = await getGuildLanguage(message.guild.id);
    if (!userLocale) {
      userLocale = message.guild?.preferredLocale || client.config?.defaultLanguage || 'Vietnamese';
    }

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('example_success')
        .setLabel(await GT(message.guild?.id, userLocale, 'success_general'))
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId('example_error')
        .setLabel(await GT(message.guild?.id, userLocale, 'error_general'))
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌'),
      new ButtonBuilder()
        .setCustomId('example_info')
        .setLabel(await GT(message.guild?.id, userLocale, 'example.info_button'))
        .setStyle(ButtonStyle.Primary)
        .setEmoji('ℹ️')
    );

    const container = EmbedComponentsV2.createContainer();
    
    container.addTextDisplay(`## ${await GT(message.guild?.id, userLocale, 'example.title')}`);
    container.addSeparator({ divider: true });
    container.addTextDisplay(await GT(message.guild?.id, userLocale, 'example.description'));
    
    container.addSeparator({ divider: true });
    
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'example.basic_params')}**\n${await GT(message.guild?.id, userLocale, 'example.basic_params_detail')}`);
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'example.advanced_params')}**\n${await GT(message.guild?.id, userLocale, 'example.advanced_params_detail')}`);
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'example.help_integration')}**\n${await GT(message.guild?.id, userLocale, 'example.help_integration_detail')}`);
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'example.interaction')}**\n${await GT(message.guild?.id, userLocale, 'example.interaction_detail')}`);
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'example.result')}**\n${await GT(message.guild?.id, userLocale, 'example.result_detail')}`);
    container.addTextDisplay(`**${await GT(message.guild?.id, userLocale, 'example.docs')}**\n${await GT(message.guild?.id, userLocale, 'example.docs_detail')}`);
    
    container.addTextDisplay(`-# ${await GT(message.guild?.id, userLocale, 'use_many.request_by')} ${message.author.tag} • <t:${Math.floor(Date.now() / 1000)}:f>`);

    const attachment = {
      attachment: Buffer.from('Đây là nội dung file ví dụ'),
      name: 'example.txt',
    };

    const buildResult = container.build();
    
    return {
      content: '📝 ' + (await GT(message.guild?.id, userLocale, 'example.title')),
      ...buildResult,
      components: [...(buildResult.components || []), buttons],
      files: [attachment],
    };
  },

  async buttonHandler(interaction) {
    let userLocale = await getGuildLanguage(interaction.guild.id);
    if (!userLocale) {
      userLocale = interaction.guild?.preferredLocale || 'Vietnamese';
    }

    const buttonId = interaction.customId;

    switch (buttonId) {
      case 'example_success':
        return {
          content: T(userLocale, 'example.success_button'),
          flags: 64,
        };

      case 'example_error':
        return {
          content: T(userLocale, 'example.error_button'),
          flags: 64,
        };

      case 'example_info':
        const container = EmbedComponentsV2.createContainer();
        container.addTextDisplay(`## ℹ️ ${await GT(interaction.guild?.id, userLocale, 'example.info_button')}`);
        container.addSeparator({ divider: true });
        container.addTextDisplay(await GT(interaction.guild?.id, userLocale, 'example.info_desc'));
        container.addTextDisplay(`**${await GT(interaction.guild?.id, userLocale, 'example.creator')}:** ${interaction.user.tag}`);
        container.addTextDisplay(`**${await GT(interaction.guild?.id, userLocale, 'example.time')}:** ${new Date().toLocaleString()}`);

        const result = container.build();
        result.flags = 64;
        return result;
    }
  },
};
