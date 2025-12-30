module.exports = {
  // Sử dụng "category_select_*" để xử lý tất cả các select menu bắt đầu bằng "category_select_"
  customId: 'category_select_*',
  async execute(interaction, client, options = {}) {
    const { selectedValue } = options;

    // Lấy thông tin về danh mục từ customId
    const categoryId = selectedValue || interaction.customId.split('_')[2];

    // Lấy giá trị đã chọn từ select menu
    const selected = interaction.values;

    if (!selected || selected.length === 0) {
      return await interaction.reply({
        content: 'Bạn chưa chọn mục nào.',
        ephemeral: true,
      });
    }

    // Xử lý dựa trên danh mục và các lựa chọn
    const responseContent = `Danh mục: **${categoryId}**\nCác mục đã chọn: ${selected.map(s => `**${s}**`).join(', ')}`;

    await interaction.reply({
      content: responseContent,
      ephemeral: true,
    });

    // Log thông tin
    console.log(
      `Người dùng ${interaction.user.tag} đã chọn mục ${selected.join(', ')} từ danh mục ${categoryId}`
    );

    // Có thể xử lý database hoặc logic khác ở đây
  },
};
