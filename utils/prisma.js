const { PrismaClient } = require('../generated');

// Khởi tạo Prisma Client
const prisma = new PrismaClient();

// Connect và disconnect database
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('Đã kết nối đến PostgreSQL database qua Prisma');
    return true;
  } catch (error) {
    console.error('Lỗi kết nối database:', error);
    return false;
  }
}

async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('Đã ngắt kết nối database');
    return true;
  } catch (error) {
    console.error('Lỗi khi ngắt kết nối database:', error);
    return false;
  }
}

// Hàm lưu và lấy ngôn ngữ của guild
async function getGuildLanguage(guildId) {
  try {
    const guildSettings = await prisma.guildSettings.findUnique({
      where: { guildId: guildId },
    });

    // Trả về language nếu có, null nếu không
    return guildSettings?.language || null;
  } catch (error) {
    console.error(`Lỗi khi lấy ngôn ngữ của guild ${guildId}:`, error);
    return null;
  }
}

async function setGuildLanguage(guildId, language) {
  try {
    const updatedGuild = await prisma.guildSettings.upsert({
      where: { guildId: guildId },
      update: { language: language },
      create: {
        guildId: guildId,
        language: language,
      },
    });

    return updatedGuild;
  } catch (error) {
    console.error(`Lỗi khi cập nhật ngôn ngữ cho guild ${guildId}:`, error);
    throw error;
  }
}

// Hàm lấy prefix của guild
async function getGuildPrefix(guildId) {
  try {
    const guildSettings = await prisma.guildSettings.findUnique({
      where: { guildId: guildId },
    });

    // Trả về prefix nếu có, null nếu không
    return guildSettings?.prefix || null;
  } catch (error) {
    console.error(`Lỗi khi lấy prefix của guild ${guildId}:`, error);
    return null;
  }
}

// Hàm cập nhật prefix của guild
async function setGuildPrefix(guildId, prefix) {
  try {
    const updatedGuild = await prisma.guildSettings.upsert({
      where: { guildId: guildId },
      update: { prefix: prefix },
      create: {
        guildId: guildId,
        prefix: prefix,
      },
    });

    return updatedGuild;
  } catch (error) {
    console.error(`Lỗi khi cập nhật prefix cho guild ${guildId}:`, error);
    throw error;
  }
}

// Hàm lấy tất cả guild settings
async function getGuildSettings(guildId) {
  try {
    const guildSettings = await prisma.guildSettings.findUnique({
      where: { guildId: guildId },
    });

    return guildSettings;
  } catch (error) {
    console.error(`Lỗi khi lấy settings của guild ${guildId}:`, error);
    return null;
  }
}

// Hàm cập nhật guild settings
async function updateGuildSettings(guildId, settings) {
  try {
    const updatedGuild = await prisma.guildSettings.upsert({
      where: { guildId: guildId },
      update: settings,
      create: {
        guildId: guildId,
        ...settings,
      },
    });

    return updatedGuild;
  } catch (error) {
    console.error(`Lỗi khi cập nhật settings cho guild ${guildId}:`, error);
    throw error;
  }
}

// Hàm lấy log channel id của guild
async function getGuildLogChannelId(guildId) {
  try {
    const guildSettings = await prisma.guildSettings.findUnique({
      where: { guildId: guildId },
      select: { logChannelId: true },
    });

    return guildSettings?.logChannelId || null;
  } catch (error) {
    console.error(`Lỗi khi lấy log channel của guild ${guildId}:`, error);
    return null;
  }
}

// Hàm lấy text override theo guild + key
async function getGuildTextOverride(guildId, key) {
  if (!guildId || !key) return null;

  try {
    const override = await prisma.guildTextOverride.findUnique({
      where: {
        guildId_key: {
          guildId,
          key,
        },
      },
    });

    return override?.text || null;
  } catch (error) {
    console.error(`Lỗi khi lấy text override cho guild ${guildId}, key ${key}:`, error);
    return null;
  }
}

// Hàm kiểm tra guild có bị ban không (stub - cần model GuildBan nếu muốn dùng)
async function getActiveGuildBan(guildId) {
  // TODO: Implement khi có model GuildBan
  return null;
}

// Ticket functions
async function getTicketConfig(guildId) {
  try {
    return await prisma.ticketConfig.findUnique({
      where: { guildId },
    });
  } catch (error) {
    console.error(`Lỗi khi lấy ticket config của guild ${guildId}:`, error);
    return null;
  }
}

async function getTicketByChannel(channelId) {
  try {
    return await prisma.ticket.findUnique({
      where: { channelId },
    });
  } catch (error) {
    console.error(`Lỗi khi lấy ticket của channel ${channelId}:`, error);
    return null;
  }
}

async function getUserOpenTicket(guildId, userId, buttonType) {
  try {
    return await prisma.ticket.findFirst({
      where: {
        guildId,
        userId,
        buttonType,
        status: 'open',
      },
    });
  } catch (error) {
    console.error(`Lỗi khi lấy ticket của user ${userId}:`, error);
    return null;
  }
}

// Stock Config functions (flexible sections + buttons system)
async function getStockConfig(guildId) {
  try {
    // Kiểm tra xem model có tồn tại không
    if (!prisma.stockConfig) {
      console.error('❌ StockConfig model không tồn tại trong Prisma client.');
      console.error('📝 Vui lòng chạy: npx prisma generate');
      console.error('🔄 Sau đó restart bot');
      return null;
    }
    
    return await prisma.stockConfig.findUnique({
      where: { guildId },
    });
  } catch (error) {
    console.error(`Lỗi khi lấy stock config của guild ${guildId}:`, error);
    return null;
  }
}

async function upsertStockConfig(guildId, data) {
  try {
    // Kiểm tra xem model có tồn tại không
    if (!prisma.stockConfig) {
      console.error('❌ StockConfig model không tồn tại trong Prisma client.');
      console.error('📝 Vui lòng chạy: npx prisma generate');
      console.error('🔄 Sau đó restart bot');
      throw new Error('StockConfig model không khả dụng');
    }
    
    return await prisma.stockConfig.upsert({
      where: { guildId },
      update: {
        sections: data.sections,
        buttons: data.buttons,
        footer: data.footer,
        enabled: data.enabled,
      },
      create: {
        guildId,
        sections: data.sections || '[]',
        buttons: data.buttons || '[]',
        footer: data.footer,
        enabled: data.enabled !== false,
      },
    });
  } catch (error) {
    console.error(`Lỗi khi cập nhật stock config cho guild ${guildId}:`, error);
    throw error;
  }
}

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase,
  getGuildLanguage,
  setGuildLanguage,
  getGuildPrefix,
  setGuildPrefix,
  getGuildSettings,
  updateGuildSettings,
  getGuildLogChannelId,
  getGuildTextOverride,
  getActiveGuildBan,
  getTicketConfig,
  getTicketByChannel,
  getUserOpenTicket,
  // Stock Config
  getStockConfig,
  upsertStockConfig,
};
