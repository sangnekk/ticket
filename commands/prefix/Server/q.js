module.exports = {
  name: 'q',
  description: 'Gửi link decor với mention user',
  aliases: ['quick', 'decor'],
  usage: '<@user/userid> <message với links>',
  examples: ['q @user https://link1.com', 'q 123456789 https://link1.com Message'],
  cooldown: 3,
  permissions: {
    bot: ['SendMessages'],
    user: ['ManageMessages'],
  },

  async execute(message, args, client) {
    if (args.length < 2) {
      return {
        content: '❌ Sử dụng: `q <@user/userid> <message>`\nVí dụ: `q @user https://link.com Message here`',
      };
    }

    // Parse user mention hoặc ID
    let targetUser;
    const userArg = args[0];
    
    const mentionMatch = userArg.match(/^<@!?(\d+)>$/);
    if (mentionMatch) {
      targetUser = await client.users.fetch(mentionMatch[1]).catch(() => null);
    } else if (/^\d+$/.test(userArg)) {
      targetUser = await client.users.fetch(userArg).catch(() => null);
    }

    if (!targetUser) {
      return {
        content: '❌ Không tìm thấy user! Vui lòng mention hoặc nhập user ID hợp lệ.',
      };
    }

    // Lấy message content (bỏ user arg)
    const messageContent = args.slice(1).join(' ');

    // Chia message thành nhiều phần nếu quá dài (Discord limit 2000 ký tự)
    const MAX_LENGTH = 1900; // Để dư chút cho an toàn
    const chunks = [];
    
    if (messageContent.length <= MAX_LENGTH) {
      chunks.push(messageContent);
    } else {
      // Chia theo dòng để không cắt giữa chừng
      const lines = messageContent.split('\n');
      let currentChunk = '';
      
      for (const line of lines) {
        if (currentChunk.length + line.length + 1 > MAX_LENGTH) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }
          // Nếu 1 dòng quá dài, cắt theo ký tự
          if (line.length > MAX_LENGTH) {
            for (let i = 0; i < line.length; i += MAX_LENGTH) {
              chunks.push(line.substring(i, i + MAX_LENGTH));
            }
          } else {
            currentChunk = line;
          }
        } else {
          currentChunk += (currentChunk ? '\n' : '') + line;
        }
      }
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
    }

    // Gửi vào DM của user
    try {
      for (const chunk of chunks) {
        await targetUser.send({ content: chunk });
      }
      
      // Xóa message gốc
      try {
        await message.delete();
      } catch (e) {}

      // Gửi thông báo trong channel
      await message.channel.send({
        content: `✅ Đã gửi tin nhắn (${chunks.length} phần)`,
      });
      
      return null;
    } catch (error) {
      return {
        content: '❌ Không thể gửi DM cho user này! User có thể đã tắt DM.',
      };
    }
  },
};
