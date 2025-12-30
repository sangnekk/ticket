module.exports = {
  // Sử dụng "feedback_form_*" để xử lý tất cả các modal bắt đầu bằng "feedback_form_"
  customId: 'feedback_form_*',
  async execute(interaction, client, options = {}) {
    const { selectedValue } = options;

    // Lấy thông tin về loại form từ customId
    const formType = selectedValue || interaction.customId.split('_')[2];

    try {
      // Lấy giá trị từ các trường input
      const feedback = interaction.fields.getTextInputValue('feedback_input');
      const rating = interaction.fields.getTextInputValue('rating_input');

      // Xử lý dựa trên loại form
      let responseContent;
      if (formType === 'product') {
        responseContent = `Cảm ơn bạn đã gửi đánh giá về sản phẩm!\nĐánh giá: ${rating}/5\nPhản hồi: ${feedback}`;
      } else if (formType === 'service') {
        responseContent = `Cảm ơn bạn đã gửi đánh giá về dịch vụ!\nĐánh giá: ${rating}/5\nPhản hồi: ${feedback}`;
      } else {
        responseContent = `Cảm ơn bạn đã gửi phản hồi!\nĐánh giá: ${rating}/5\nPhản hồi: ${feedback}`;
      }

      await interaction.reply({
        content: responseContent,
        ephemeral: true,
      });

      // Log thông tin
      console.log(
        `Người dùng ${interaction.user.tag} đã gửi phản hồi loại ${formType}: ${feedback} (${rating}/5)`
      );

      // Có thể lưu vào database hoặc xử lý thêm ở đây
    } catch (error) {
      console.error(`Lỗi khi xử lý feedback form ${formType}:`, error);
      await interaction.reply({
        content: 'Đã xảy ra lỗi khi xử lý phản hồi của bạn.',
        ephemeral: true,
      });
    }
  },
};
