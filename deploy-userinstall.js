const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { clientId, token, guildId } = require('./config.json');

// Khởi tạo mảng để lưu trữ các lệnh
const globalCommands = []; // Lệnh cho mọi người dùng
const guildCommands = []; // Lệnh chỉ cho guild chính

// Danh sách các thư mục chứa lệnh chỉ dành cho guild chính
const GUILD_ONLY_FOLDERS = ['Staff'];

// Tạo instance REST
const rest = new REST({ version: '10' }).setToken(token);

// Hàm để phân loại và tải các lệnh
function loadCommands() {
  // Clear mảng commands
  globalCommands.length = 0;
  guildCommands.length = 0;

  const commandPath = path.join(__dirname, 'commands', 'slash');

  // Kiểm tra xem thư mục có tồn tại không
  if (!fs.existsSync(commandPath)) {
    console.log(`Không tìm thấy thư mục: ${commandPath}`);
    return;
  }

  // Lấy tất cả thư mục con trong thư mục slash
  const subfolders = fs.readdirSync(commandPath);

  // Xử lý từng thư mục con
  for (const subfolder of subfolders) {
    const subfolderPath = path.join(commandPath, subfolder);

    // Kiểm tra đây có phải là thư mục không
    if (fs.statSync(subfolderPath).isDirectory()) {
      // Lấy tất cả file .js trong thư mục
      const commandFiles = fs.readdirSync(subfolderPath).filter(file => file.endsWith('.js'));

      // Đọc từng file command
      for (const file of commandFiles) {
        const filePath = path.join(subfolderPath, file);

        // Xóa cache để đảm bảo load phiên bản mới nhất
        delete require.cache[require.resolve(filePath)];

        try {
          const command = require(filePath);

          if ('data' in command && 'execute' in command) {
            // Phân loại command dựa vào thư mục
            const commandData = command.data.toJSON();

            if (GUILD_ONLY_FOLDERS.includes(subfolder)) {
              // Nếu command nằm trong thư mục Staff, chỉ đăng ký cho guild chính
              guildCommands.push(commandData);
              console.log(
                `✓ Đã tải lệnh chỉ dành cho guild: ${commandData.name} từ ${subfolder}/${file}`
              );
            } else {
              // Ngược lại, đăng ký như global command
              globalCommands.push(commandData);
              console.log(`✓ Đã tải lệnh toàn cầu: ${commandData.name} từ ${subfolder}/${file}`);
            }
          } else {
            console.log(
              `✗ [CẢNH BÁO] Command tại ${filePath} thiếu thuộc tính "data" hoặc "execute" bắt buộc.`
            );
          }
        } catch (error) {
          console.error(`Lỗi khi tải command từ ${filePath}:`, error);
        }
      }
    }
  }
}

// Hàm chính để deploy commands
async function deployCommands() {
  try {
    // Tải tất cả commands
    loadCommands();

    console.log('== THỐNG KÊ COMMANDS ==');
    console.log(`Commands toàn cầu (mọi user): ${globalCommands.length}`);
    console.log(`Commands chỉ dành cho guild chính: ${guildCommands.length}`);

    // Deploy global commands (mọi người có thể dùng)
    if (globalCommands.length > 0) {
      console.log('Đang đăng ký commands toàn cầu...');
      const globalData = await rest.put(Routes.applicationCommands(clientId), {
        body: globalCommands,
      });
      console.log(`✓ Đã đăng ký thành công ${globalData.length} lệnh toàn cầu.`);
    }

    // Deploy guild-only commands (chỉ trong guild chính)
    if (guildCommands.length > 0 && guildId) {
      console.log(`Đang đăng ký commands chỉ dành cho guild ${guildId}...`);
      const guildData = await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: guildCommands,
      });
      console.log(`✓ Đã đăng ký thành công ${guildData.length} lệnh cho guild ${guildId}.`);
    }

    console.log('=== HOÀN TẤT ĐầY ĐỦ ===');
  } catch (error) {
    console.error('Lỗi khi deploy commands:', error);
  }
}

// Thực thi hàm chính nếu file được gọi trực tiếp
if (require.main === module) {
  deployCommands();
}

module.exports = { deployCommands };
