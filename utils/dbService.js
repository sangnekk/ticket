const { prisma } = require('./prisma');
const { i18n, T } = require('../plugins/i18n');

// Service quản lý các lệnh bị vô hiệu hóa
const disabledCommandsService = {
  // Lấy tất cả các lệnh bị vô hiệu hóa
  getAll: async () => {
    return await prisma.disabledCommand.findMany();
  },

  // Thêm một lệnh vào danh sách vô hiệu hóa
  add: async commandId => {
    try {
      const exists = await prisma.disabledCommand.findFirst({
        where: { commandId },
      });

      if (!exists) {
        await prisma.disabledCommand.create({
          data: { commandId },
        });
        return true;
      }
      return false; // Đã tồn tại
    } catch (error) {
      console.error(T(i18n.getLocale(), 'error.db.add_disabled_command', { error }));
      return false;
    }
  },

  // Xóa một lệnh khỏi danh sách vô hiệu hóa
  remove: async commandId => {
    try {
      await prisma.disabledCommand.deleteMany({
        where: { commandId },
      });
      return true;
    } catch (error) {
      console.error(T(i18n.getLocale(), 'error.db.remove_disabled_command', { error }));
      return false;
    }
  },

  // Kiểm tra xem một lệnh có bị vô hiệu hóa không
  isDisabled: async commandId => {
    const command = await prisma.disabledCommand.findFirst({
      where: { commandId },
    });
    return !!command;
  },
};

// Service quản lý guild settings
const guildSettingsService = {
  // Lấy thiết lập của một guild
  get: async guildId => {
    let settings = await prisma.guildSettings.findUnique({
      where: { guildId },
    });

    if (!settings) {
      // Tạo thiết lập mặc định nếu chưa có
      settings = await prisma.guildSettings.create({
        data: { guildId },
      });
    }

    return settings;
  },

  // Cập nhật thiết lập của một guild
  update: async (guildId, data) => {
    try {
      const settings = await prisma.guildSettings.upsert({
        where: { guildId },
        update: data,
        create: { guildId, ...data },
      });

      return settings;
    } catch (error) {
      console.error(T(i18n.getLocale(), 'error.db.update_guild_settings', { guildId, error }));
      return null;
    }
  },
};

module.exports = {
  disabledCommandsService,
  guildSettingsService,
};
