const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'q',
  description: 'Gửi link decor với mention user',
  aliases: ['quick', 'decor'],
  usage: '<@user/userid> <message với links>',
  examples: ['q @user https://link1.com', 'q 123456789 https://link1.com https://link2.com Message'],
  cooldown: 3,
  permissions: {
    bot: ['SendMessages'],
    user: ['ManageMessages'],
  },

  async execute(message, args, client) {
    if (args.length < 2) {
      return {
        content: '❌ Sử dụng: `q <@user/userid> <message với links>`\nVí dụ: `q @user https://link.com Message here`',
      };
    }

    // Parse user mention hoặc ID
    let targetUser;
    const userArg = args[0];
    
    // Check nếu là mention
    const mentionMatch = userArg.match(/^<@!?(\d+)>$/);
    if (mentionMatch) {
      targetUser = await client.users.fetch(mentionMatch[1]).catch(() => null);
    } else if (/^\d+$/.test(userArg)) {
      // Check nếu là user ID
      targetUser = await client.users.fetch(userArg).catch(() => null);
    }

    if (!targetUser) {
      return {
        content: '❌ Không tìm thấy user! Vui lòng mention hoặc nhập user ID hợp lệ.',
      };
    }

    // Lấy message content (bỏ user arg)
    const messageContent = args.slice(1).join(' ');

    // Extract links từ message
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const links = messageContent.match(urlRegex) || [];
    
    // Lấy text không phải link
    const textContent = messageContent.replace(urlRegex, '').trim();

    if (links.length === 0) {
      return {
        content: '❌ Không tìm thấy link nào trong message!',
      };
    }

    // Tạo embed thường
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🎨 Link Decor')
      .setDescription(`Đây chỉ là thông tin để chúng tôi làm đơn. Vui lòng không quan tâm`);

    // Thêm text content nếu có
    if (textContent) {
      embed.addFields({
        name: '📝 Lời nhắn',
        value: textContent,
        inline: false,
      });
    }

    // Phân bổ links đẹp mắt - hiển thị link trực tiếp
    let linksText = '';
    
    if (links.length === 1) {
      linksText = links[0];
    } else if (links.length === 2) {
      linksText = `${links[0]}\n\n${links[1]}`;
    } else if (links.length <= 5) {
      linksText = links.map((link, index) => `**${index + 1}.** ${link}`).join('\n\n');
    } else {
      // Nhiều hơn 5 links: Chia thành 2 cột
      const half = Math.ceil(links.length / 2);
      const leftColumn = links.slice(0, half);
      const rightColumn = links.slice(half);
      
      for (let i = 0; i < half; i++) {
        linksText += `**${i + 1}.** ${leftColumn[i]}`;
        if (rightColumn[i]) {
          linksText += `\n**${i + half + 1}.** ${rightColumn[i]}`;
        }
        linksText += '\n\n';
      }
    }

    embed.addFields({
      name: `📦 Link${links.length > 1 ? 's' : ''} (${links.length})`,
      value: linksText,
      inline: false,
    });

    // Footer
    embed.setFooter({
      text: `Gửi bởi ${message.author.username} • ${new Date().toLocaleString('vi-VN')}`,
      iconURL: message.author.displayAvatarURL(),
    });

    // Gửi vào DM của user
    try {
      await targetUser.send({ embeds: [embed] });
      
      // Xóa message gốc
      try {
        await message.delete();
      } catch (e) {
        // Ignore nếu không xóa được
      }

      // Gửi thông báo trong channel (không return vì message đã bị xóa)
      await message.channel.send({
        content: '✅ Link deco đã được gửi đi',
      });
      
      return null; // Không return gì để tránh commandResponse xử lý
    } catch (error) {
      // Nếu không gửi được DM (user tắt DM)
      return {
        content: '❌ Không thể gửi DM cho user này! User có thể đã tắt DM.',
      };
    }
  },
};
