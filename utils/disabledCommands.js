const { prisma } = require('./prisma');

// Hàm lưu danh sách lệnh bị vô hiệu hóa vào database
async function saveDisabledCommands(disabledSet) {
  try {
    // Xóa tất cả các bản ghi cũ
    await prisma.disabledCommand.deleteMany({});

    // Thêm các bản ghi mới từ disabledSet
    const commands = Array.from(disabledSet);
    for (const commandId of commands) {
      await prisma.disabledCommand.create({
        data: {
          commandId,
        },
      });
    }

    console.log('Đã lưu trạng thái các lệnh bị vô hiệu hóa vào database');
  } catch (error) {
    console.error('Lỗi khi lưu trạng thái vào database:', error);
  }
}

// Hàm đọc danh sách lệnh bị vô hiệu hóa từ database
async function loadDisabledCommands(disabledSet) {
  try {
    const commands = await prisma.disabledCommand.findMany();

    if (commands && commands.length > 0) {
      commands.forEach(cmd => disabledSet.add(cmd.commandId));
      console.log(`Đã tải ${commands.length} lệnh bị vô hiệu hóa từ database`);
    }
  } catch (error) {
    console.error('Lỗi khi đọc dữ liệu từ database:', error);
  }
}

module.exports = {
  saveDisabledCommands,
  loadDisabledCommands,
};
