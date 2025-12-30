const { MessageFlags } = require('discord.js');

/**
 * Xử lý lỗi Discord API và trả về thông báo dễ hiểu
 * @param {Error} error - Lỗi từ Discord API
 * @param {Object} context - Context bổ sung (channel, user, etc.)
 * @returns {string} Thông báo lỗi dễ hiểu
 */
function getErrorMessage(error, context = {}) {
  const { channel, action = 'thực hiện hành động' } = context;
  
  // Lỗi Discord API
  if (error.code) {
    switch (error.code) {
      case 10003:
        return '❌ Không tìm thấy kênh. Kênh có thể đã bị xóa.';
      
      case 10008:
        return '❌ Không tìm thấy tin nhắn. Tin nhắn có thể đã bị xóa.';
      
      case 10013:
        return '❌ Không tìm thấy người dùng.';
      
      case 10062:
        return '❌ Tương tác đã hết hạn hoặc không hợp lệ.';
      
      case 50001:
        return channel 
          ? `❌ Bot thiếu quyền truy cập ${channel.toString()}. Vui lòng kiểm tra:\n• Bot có thể xem kênh này\n• Bot có quyền "View Channel"\n• Bot có quyền "Send Messages"\n• Bot có quyền "Embed Links"`
          : '❌ Bot thiếu quyền truy cập. Vui lòng kiểm tra quyền của bot.';
      
      case 50013:
        return channel
          ? `❌ Bot thiếu quyền để ${action} trong ${channel.toString()}. Vui lòng cấp các quyền cần thiết cho bot.`
          : `❌ Bot thiếu quyền để ${action}. Vui lòng cấp các quyền cần thiết cho bot.`;
      
      case 50035:
        return '❌ Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.';
      
      case 50055:
        return '❌ Không thể xóa tin nhắn này vì nó quá cũ (hơn 14 ngày).';
      
      case 160002:
        return '❌ Webhook đã bị xóa hoặc không tồn tại.';
      
      default:
        if (error.status === 403) {
          return '❌ Bot bị từ chối truy cập. Vui lòng kiểm tra quyền của bot.';
        }
        if (error.status === 404) {
          return '❌ Không tìm thấy tài nguyên yêu cầu.';
        }
        if (error.status === 429) {
          return '❌ Bot đang bị giới hạn tốc độ. Vui lòng thử lại sau.';
        }
        return `❌ Lỗi Discord API (${error.code}): ${error.message || 'Lỗi không xác định'}`;
    }
  }
  
  // Lỗi timeout
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return '❌ Yêu cầu hết thời gian chờ. Vui lòng thử lại sau.';
  }
  
  // Lỗi network
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return '❌ Không thể kết nối đến dịch vụ. Vui lòng thử lại sau.';
  }
  
  // Lỗi chung
  return `❌ Đã xảy ra lỗi: ${error.message || 'Lỗi không xác định'}`;
}

/**
 * Gửi thông báo lỗi cho người dùng qua DM hoặc reply
 * @param {Object} options - Tùy chọn
 * @param {Error} options.error - Lỗi cần xử lý
 * @param {User} options.user - Người dùng cần nhận thông báo
 * @param {Interaction|Message} options.source - Interaction hoặc Message gốc
 * @param {Object} options.context - Context bổ sung
 * @returns {Promise<boolean>} True nếu gửi thành công
 */
async function notifyUser({ error, user, source, context = {} }) {
  const errorMessage = getErrorMessage(error, context);
  
  // Thử gửi DM trước
  let dmSent = false;
  try {
    await user.send({
      content: `⚠️ **Thông báo lỗi**\n\n${errorMessage}\n\n*Lỗi này xảy ra khi bạn sử dụng bot trong server ${source.guild?.name || 'Unknown'}*`
    });
    dmSent = true;
    return true;
  } catch (dmError) {
    console.log(`Không thể gửi DM cho ${user.tag}:`, dmError.message);
  }
  
  // Nếu không gửi được DM, gửi vào kênh nơi user sử dụng lệnh
  if (!dmSent) {
    try {
      // Thử reply/followUp cho Interaction
      if (source.isRepliable && source.isRepliable()) {
        const replyContent = `${user.toString()} ${errorMessage}`;
        
        if (source.replied || source.deferred) {
          await source.followUp({
            content: replyContent,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await source.reply({
            content: replyContent,
            flags: MessageFlags.Ephemeral,
          });
        }
        return true;
      } 
      // Thử reply cho Message
      else if (source.reply) {
        await source.reply({
          content: `${user.toString()} ${errorMessage}`,
        });
        return true;
      }
      // Fallback: gửi vào kênh trực tiếp
      else if (source.channel) {
        await source.channel.send({
          content: `${user.toString()} ${errorMessage}`,
        });
        return true;
      }
    } catch (replyError) {
      console.error('Không thể gửi thông báo lỗi vào kênh:', replyError.message);
      
      // Thử gửi trực tiếp vào kênh nếu reply thất bại
      try {
        if (source.channel) {
          await source.channel.send({
            content: `${user.toString()} ${errorMessage}`,
          });
          return true;
        }
      } catch (channelError) {
        console.error('Không thể gửi vào kênh:', channelError.message);
      }
    }
  }
  
  return false;
}

/**
 * Wrapper để xử lý lỗi tự động cho async functions
 * @param {Function} fn - Async function cần wrap
 * @param {Object} errorContext - Context cho error handler
 * @returns {Function} Wrapped function
 */
function withErrorHandler(fn, errorContext = {}) {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      console.error('Error caught by handler:', error);
      
      // Tìm user và source từ args
      const source = args.find(arg => arg?.user || arg?.author);
      const user = source?.user || source?.author;
      
      if (user && source) {
        await notifyUser({
          error,
          user,
          source,
          context: errorContext,
        });
      }
      
      throw error; // Re-throw để caller có thể xử lý thêm nếu cần
    }
  };
}

module.exports = {
  getErrorMessage,
  notifyUser,
  withErrorHandler,
};
