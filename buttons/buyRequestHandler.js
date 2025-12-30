const { MessageFlags } = require('discord-api-types/v10');

module.exports = {
  // Sử dụng "buy_request_*" để xử lý tất cả các button bắt đầu bằng "buy_request_"
  customId: 'buy_request_*',
  async execute(interaction, client, options = {}) {
    const { selectedValue } = options;

    // Nếu không có selectedValue từ pattern matching, thử lấy từ customId
    const itemId = selectedValue || interaction.customId.split('_')[2];

    if (!itemId) {
      return await interaction.reply({
        content: 'Không tìm thấy thông tin về mặt hàng.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.reply({
      content: `Bạn đã gửi yêu cầu mua mặt hàng có ID: **${itemId}**.`,
      flags: MessageFlags.Ephemeral,
    });

    // Có thể thực hiện các hành động khác dựa trên itemId
    console.log(`Người dùng ${interaction.user.tag} muốn mua mặt hàng: ${itemId}`);

    // Có thể return một object để gửi reply khác (nếu cần)
    // return {
    //     content: 'Thông báo bổ sung',
    //     flags: MessageFlags.Ephemeral
    // };
  },
};
