module.exports = {
  customId: 'example_modal',
  async execute(interaction, client) {
    // Lấy giá trị từ các trường của modal
    const favorite = interaction.fields.getTextInputValue('favorite_field');
    const reason = interaction.fields.getTextInputValue('reason_field');

    await interaction.reply({
      content: `Bạn đã nhập: \n**Yêu thích:** ${favorite}\n**Lý do:** ${reason}`,
      ephemeral: true,
    });
  },
};
