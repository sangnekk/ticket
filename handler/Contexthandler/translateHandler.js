module.exports = {
  // Sử dụng "translate_*" để xử lý tất cả các context menu command bắt đầu bằng "translate_"
  customId: 'translate_*',
  async execute(interaction, client, options = {}) {
    const { selectedValue } = options;

    // Lấy thông tin ngôn ngữ đích từ customId (vd: translate_vi, translate_en, translate_fr...)
    const targetLang =
      selectedValue ||
      interaction.customId?.split('_')[1] ||
      interaction.commandName?.split('_')[1] ||
      'vi';

    // Chỉ hoạt động với message context menu
    if (interaction.targetType !== 'MESSAGE') {
      return await interaction.reply({
        content: 'Lệnh này chỉ hoạt động với tin nhắn.',
        ephemeral: true,
      });
    }

    const message = interaction.targetMessage;
    if (!message.content || message.content.trim() === '') {
      return await interaction.reply({
        content: 'Tin nhắn không có nội dung để dịch.',
        ephemeral: true,
      });
    }

    // Thông báo đang xử lý
    await interaction.deferReply({ ephemeral: true });

    try {
      // Trong thực tế, bạn sẽ gọi một API dịch thuật ở đây
      // Đây chỉ là mô phỏng cho việc dịch
      const translations = {
        en: {
          name: 'Tiếng Anh',
          sample: 'This is a sample translation to English.',
          greeting: 'Hello, how are you?',
        },
        vi: {
          name: 'Tiếng Việt',
          sample: 'Đây là bản dịch mẫu sang tiếng Việt.',
          greeting: 'Xin chào, bạn khỏe không?',
        },
        fr: {
          name: 'Tiếng Pháp',
          sample: 'Ceci est un exemple de traduction en français.',
          greeting: 'Bonjour, comment allez-vous?',
        },
        ja: {
          name: 'Tiếng Nhật',
          sample: 'これは日本語への翻訳例です。',
          greeting: 'こんにちは、お元気ですか？',
        },
      };

      // Giả lập dịch thuật
      let translatedText = '';
      if (translations[targetLang]) {
        const langInfo = translations[targetLang];

        // Giả lập dịch dựa trên các từ khóa trong tin nhắn
        if (
          message.content.toLowerCase().includes('hello') ||
          message.content.toLowerCase().includes('hi') ||
          message.content.toLowerCase().includes('chào')
        ) {
          translatedText = langInfo.greeting;
        } else {
          translatedText = langInfo.sample;
        }

        await interaction.editReply({
          content: `**Bản dịch sang ${langInfo.name}:**\n${translatedText}\n\n**Tin nhắn gốc:**\n${message.content}`,
        });
      } else {
        await interaction.editReply({
          content: `Không hỗ trợ dịch sang ngôn ngữ có mã: ${targetLang}`,
        });
      }
    } catch (error) {
      console.error(`Lỗi khi dịch tin nhắn sang ${targetLang}:`, error);
      await interaction.editReply({
        content: 'Đã xảy ra lỗi khi dịch tin nhắn.',
      });
    }

    // Log thông tin
    console.log(`Người dùng ${interaction.user.tag} đã dịch một tin nhắn sang ${targetLang}`);
  },
};
