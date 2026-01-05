const { getRedisSubscriber, getRedisPublisher } = require('./redis');

/**
 * Config Sync Manager - Đồng bộ config real-time giữa web và bot
 */
class ConfigSyncManager {
  constructor() {
    this.subscriber = null;
    this.publisher = null;
    this.listeners = new Map();
    this.isInitialized = false;
  }

  /**
   * Khởi tạo config sync
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[ConfigSync] Đã được khởi tạo rồi');
      return;
    }

    try {
      this.subscriber = getRedisSubscriber();
      this.publisher = getRedisPublisher();

      // Subscribe to config update channel
      await this.subscriber.subscribe('bot:config:update', (err) => {
        if (err) {
          console.error('[ConfigSync] Lỗi khi subscribe:', err);
          return;
        }
        console.log('[ConfigSync] ✅ Đã subscribe channel bot:config:update');
      });

      // Listen for messages
      this.subscriber.on('message', (channel, message) => {
        if (channel === 'bot:config:update') {
          this.handleConfigUpdate(message);
        }
      });

      this.isInitialized = true;
      console.log('[ConfigSync] ✅ Config sync đã sẵn sàng');
    } catch (error) {
      console.error('[ConfigSync] ❌ Lỗi khi khởi tạo:', error);
    }
  }

  /**
   * Xử lý config update message
   */
  handleConfigUpdate(message) {
    try {
      const data = JSON.parse(message);
      const { type, guildId, config } = data;

      console.log(`[ConfigSync] 📥 Nhận update: ${type} cho guild ${guildId}`);

      // Trigger listeners
      const listeners = this.listeners.get(type) || [];
      listeners.forEach(callback => {
        try {
          callback(guildId, config);
        } catch (err) {
          console.error(`[ConfigSync] Lỗi khi gọi listener:`, err);
        }
      });

      // Trigger wildcard listeners
      const wildcardListeners = this.listeners.get('*') || [];
      wildcardListeners.forEach(callback => {
        try {
          callback(type, guildId, config);
        } catch (err) {
          console.error(`[ConfigSync] Lỗi khi gọi wildcard listener:`, err);
        }
      });
    } catch (error) {
      console.error('[ConfigSync] Lỗi khi parse message:', error);
    }
  }

  /**
   * Đăng ký listener cho config type
   * @param {string} type - Loại config (stock, ticket, text-override, hoặc '*' cho tất cả)
   * @param {function} callback - Callback function
   */
  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);
    console.log(`[ConfigSync] Đã đăng ký listener cho type: ${type}`);
  }

  /**
   * Publish config update (dùng từ web server)
   * @param {string} type - Loại config
   * @param {string} guildId - Guild ID
   * @param {object} config - Config data
   */
  async publishUpdate(type, guildId, config = null) {
    if (!this.publisher) {
      console.error('[ConfigSync] Publisher chưa được khởi tạo');
      return;
    }

    try {
      const message = JSON.stringify({
        type,
        guildId,
        config,
        timestamp: Date.now(),
      });

      await this.publisher.publish('bot:config:update', message);
      console.log(`[ConfigSync] 📤 Đã publish update: ${type} cho guild ${guildId}`);
    } catch (error) {
      console.error('[ConfigSync] Lỗi khi publish update:', error);
    }
  }

  /**
   * Cleanup
   */
  async cleanup() {
    if (this.subscriber) {
      await this.subscriber.unsubscribe('bot:config:update');
    }
    this.listeners.clear();
    this.isInitialized = false;
    console.log('[ConfigSync] Đã cleanup');
  }
}

// Singleton instance
const configSyncManager = new ConfigSyncManager();

module.exports = configSyncManager;
