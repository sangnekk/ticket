const { ShardingManager } = require('discord.js');
const path = require('path');
const config = require('./config.json');

// Khởi tạo ShardingManager
const manager = new ShardingManager(path.join(__dirname, 'index.js'), {
  token: config.token,
  totalShards: config.cluster?.totalShards === 'auto' ? 'auto' : config.cluster?.totalShards || 1,
  shardList: config.cluster?.shardList || undefined,
  mode: 'process',
  respawn: true,
});

// Event: Khi shard được tạo
manager.on('shardCreate', shard => {
  console.log(`[Shard Manager] Shard ${shard.id} đã được tạo`);

  shard.on('ready', () => {
    console.log(`[Shard Manager] Shard ${shard.id} đã sẵn sàng`);
  });

  shard.on('disconnect', () => {
    console.log(`[Shard Manager] Shard ${shard.id} đã ngắt kết nối`);
  });

  shard.on('reconnecting', () => {
    console.log(`[Shard Manager] Shard ${shard.id} đang kết nối lại`);
  });

  shard.on('death', () => {
    console.log(`[Shard Manager] Shard ${shard.id} đã chết`);
  });

  shard.on('error', error => {
    console.error(`[Shard Manager] Lỗi Shard ${shard.id}:`, error);
  });
});

// Khởi động sharding manager
manager.spawn().catch(error => {
  console.error('[Shard Manager] Lỗi khi khởi động sharding manager:', error);
  process.exit(1);
});

// Xử lý graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Shard Manager] Nhận lệnh shutdown, đang tắt tất cả shards...');
  await manager.shards.forEach(shard => shard.kill());
  await manager.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Shard Manager] Nhận lệnh SIGTERM, đang tắt tất cả shards...');
  await manager.shards.forEach(shard => shard.kill());
  await manager.destroy();
  process.exit(0);
});

