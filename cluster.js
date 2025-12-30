const cluster = require('cluster');
const os = require('os');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const config = require('./config.json');
const { getRedisClient, getRedisSubscriber, getRedisPublisher, closeRedis } = require('./utils/redis');

let workers = [];
let workerId = 0;
let totalShards = 1;
let shardsPerCluster = config.cluster?.shardsPerCluster || 2;
let totalClusters = 1;
let restartQueue = [];
let isRestarting = false;

// Hàm tính toán số shards cần thiết
async function calculateTotalShards() {
  if (config.cluster?.totalShards === 'auto') {
    try {
      const { REST } = require('@discordjs/rest');
      const { Routes } = require('discord-api-types/v10');
      const rest = new REST({ version: '10' }).setToken(config.token);

      const { shards } = await rest.get(Routes.gatewayBot());
      totalShards = shards;
      console.log(`[Cluster Manager] Discord đề xuất ${totalShards} shards`);
      return totalShards;
    } catch (error) {
      console.error('[Cluster Manager] Lỗi khi lấy thông tin shards từ Discord:', error);
      console.log('[Cluster Manager] Sử dụng 1 shard mặc định');
      return 1;
    }
  } else {
    totalShards = config.cluster?.totalShards || 1;
    return totalShards;
  }
}

// Hàm tính toán số clusters cần thiết
function calculateTotalClusters() {
  if (config.cluster?.totalClusters === 'auto') {
    // Sử dụng số CPU cores - 1 (để dành 1 core cho cluster manager)
    const cpuCount = os.cpus().length;
    totalClusters = Math.max(1, Math.ceil(totalShards / shardsPerCluster));
    totalClusters = Math.min(totalClusters, cpuCount - 1);
    console.log(`[Cluster Manager] Tự động tính toán: ${totalClusters} clusters (dựa trên ${cpuCount} CPU cores)`);
  } else {
    totalClusters = config.cluster?.totalClusters || 1;
  }
  return totalClusters;
}

// Phân chia shards cho mỗi cluster
function getShardsForCluster(clusterId) {
  const shards = [];
  const startShard = clusterId * shardsPerCluster;
  const endShard = Math.min(startShard + shardsPerCluster, totalShards);

  for (let i = startShard; i < endShard; i++) {
    shards.push(i);
  }

  return shards;
}

// Khởi động một cluster worker
function spawnCluster(clusterId) {
  const shards = getShardsForCluster(clusterId);

  if (shards.length === 0) {
    console.log(`[Cluster Manager] Cluster ${clusterId} không có shards nào, bỏ qua`);
    return null;
  }

  const worker = cluster.fork({
    CLUSTER_ID: clusterId,
    SHARD_IDS: JSON.stringify(shards),
    TOTAL_SHARDS: totalShards,
  });

  worker.clusterId = clusterId;
  worker.shards = shards;

  worker.on('message', msg => {
    if (msg.name === 'ready') {
      console.log(`[Cluster Manager] Cluster ${msg.clusterId} đã sẵn sàng với shards [${msg.shardIds.join(', ')}]`);
    }
  });

  worker.on('exit', (code, signal) => {
    console.log(`[Cluster Manager] Cluster ${clusterId} đã thoát với code ${code} và signal ${signal}`);
    workers[clusterId] = null;

    // Tự động restart nếu không phải do shutdown
    if (!isRestarting && code !== 0 && signal !== 'SIGTERM') {
      console.log(`[Cluster Manager] Đang tự động restart cluster ${clusterId}...`);
      setTimeout(() => {
        if (!isRestarting) {
          spawnCluster(clusterId);
        }
      }, 5000);
    }
  });

  workers[clusterId] = worker;
  console.log(`[Cluster Manager] Đã khởi động cluster ${clusterId} với shards [${shards.join(', ')}]`);

  return worker;
}

// Khởi động tất cả clusters
async function spawnAllClusters() {
  console.log(`[Cluster Manager] Đang khởi động ${totalClusters} clusters...`);

  // Tính toán shards
  await calculateTotalShards();
  calculateTotalClusters();

  // Điều chỉnh lại totalClusters nếu cần
  const requiredClusters = Math.ceil(totalShards / shardsPerCluster);
  if (totalClusters > requiredClusters) {
    totalClusters = requiredClusters;
  }

  workers = new Array(totalClusters);

  for (let i = 0; i < totalClusters; i++) {
    spawnCluster(i);
    // Delay nhỏ giữa các cluster để tránh rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`[Cluster Manager] Đã khởi động ${totalClusters} clusters`);
}

// Restart tất cả clusters
async function restartAllClusters() {
  if (isRestarting) {
    console.log('[Cluster Manager] Đang trong quá trình restart, bỏ qua...');
    return;
  }

  isRestarting = true;
  console.log('[Cluster Manager] Đang restart tất cả clusters...');

  // Gửi lệnh shutdown cho tất cả workers
  const shutdownPromises = workers
    .filter(w => w !== null && w !== undefined)
    .map(worker => {
      return new Promise(resolve => {
        worker.once('exit', () => resolve());
        worker.send({ name: 'shutdown' });
      });
    });

  await Promise.all(shutdownPromises);

  // Đợi một chút trước khi restart
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Clear cache của Node.js (clear require cache)
  clearRequireCache();

  // Restart tất cả clusters
  await spawnAllClusters();

  isRestarting = false;
  console.log('[Cluster Manager] Đã restart tất cả clusters thành công');
}

// Clear require cache (trừ node_modules)
function clearRequireCache() {
  const cacheKeys = Object.keys(require.cache);
  const projectPath = __dirname;

  cacheKeys.forEach(key => {
    // Chỉ clear cache của các file trong project, không clear node_modules
    if (key.startsWith(projectPath) && !key.includes('node_modules')) {
      delete require.cache[key];
    }
  });

  console.log('[Cluster Manager] Đã clear require cache');
}

// Setup file watcher để auto-reload
function setupFileWatcher() {
  if (!config.autoReload) {
    console.log('[Cluster Manager] Auto-reload đã tắt trong config');
    return;
  }

  const watchPatterns = config.watchFiles || ['**/*.js'];
  const ignorePatterns = [
    '**/node_modules/**',
    '**/.git/**',
    '**/package-lock.json',
    '**/bots.json',
    'cluster.js',
    'shard.js',
  ];

  console.log('[Cluster Manager] Đang thiết lập file watcher...');

  const watcher = chokidar.watch(watchPatterns, {
    ignored: ignorePatterns,
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100,
    },
  });

  let restartTimeout = null;

  watcher.on('change', filePath => {
    console.log(`[Cluster Manager] File đã thay đổi: ${filePath}`);
    
    // Debounce: Đợi 2 giây sau khi file thay đổi cuối cùng mới restart
    if (restartTimeout) {
      clearTimeout(restartTimeout);
    }

    restartTimeout = setTimeout(() => {
      console.log(`[Cluster Manager] Phát hiện thay đổi file, đang restart clusters...`);
      restartAllClusters().catch(error => {
        console.error('[Cluster Manager] Lỗi khi restart clusters:', error);
      });
    }, 2000);
  });

  watcher.on('error', error => {
    console.error('[Cluster Manager] Lỗi file watcher:', error);
  });

  console.log('[Cluster Manager] File watcher đã sẵn sàng');
}

// Setup Redis IPC
function setupRedisIPC() {
  if (!config.clustering) {
    return;
  }

  try {
    const redisSubscriber = getRedisSubscriber();
    const redisPublisher = getRedisPublisher();

    // Subscribe to IPC channel
    redisSubscriber.subscribe('bot:ipc', (err, count) => {
      if (err) {
        console.error('[Cluster Manager] Lỗi khi subscribe Redis:', err);
        return;
      }
      console.log(`[Cluster Manager] Đã subscribe Redis IPC channel`);
    });

    // Listen for messages
    redisSubscriber.on('message', (channel, message) => {
      if (channel === 'bot:ipc') {
        try {
          const msg = JSON.parse(message);
          handleIPCMessage(msg, redisPublisher);
        } catch (error) {
          console.error('[Cluster Manager] Lỗi khi parse IPC message:', error);
        }
      }
    });

    console.log('[Cluster Manager] Redis IPC đã được thiết lập');
  } catch (error) {
    console.error('[Cluster Manager] Lỗi khi thiết lập Redis IPC:', error);
  }
}

// Handle IPC messages
function handleIPCMessage(msg, redisPublisher) {
  if (msg.type === 'broadcast') {
    // Broadcast message to all workers
    workers.forEach(worker => {
      if (worker && worker.isConnected()) {
        worker.send(msg.data);
      }
    });
  } else if (msg.type === 'restart') {
    restartAllClusters();
  }
}

// Main function
async function main() {
  if (!config.clustering && !config.sharding) {
    console.log('[Cluster Manager] Clustering và Sharding đã tắt, chạy bot trực tiếp...');
    require('./index.js');
    return;
  }

  if (config.sharding && !config.clustering) {
    console.log('[Cluster Manager] Chỉ bật Sharding, chuyển sang Shard Manager...');
    require('./shard.js');
    return;
  }

  // Clustering mode
  console.log('[Cluster Manager] Khởi động Cluster Manager...');

  // Setup Redis IPC nếu clustering được bật
  if (config.clustering) {
    setupRedisIPC();
  }

  // Setup file watcher
  setupFileWatcher();

  // Spawn all clusters
  await spawnAllClusters();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('[Cluster Manager] Nhận lệnh SIGINT, đang tắt...');
    await shutdown();
  });

  process.on('SIGTERM', async () => {
    console.log('[Cluster Manager] Nhận lệnh SIGTERM, đang tắt...');
    await shutdown();
  });
}

// Shutdown function
async function shutdown() {
  isRestarting = true;

  // Gửi lệnh shutdown cho tất cả workers
  const shutdownPromises = workers
    .filter(w => w !== null && w !== undefined)
    .map(worker => {
      return new Promise(resolve => {
        if (!worker.isConnected()) {
          resolve();
          return;
        }

        const exitHandler = () => resolve();
        worker.once('exit', exitHandler);
        
        try {
          worker.send({ name: 'shutdown' });
        } catch (error) {
          console.error(`[Cluster Manager] Lỗi khi gửi shutdown tới worker:`, error);
          worker.kill('SIGTERM');
        }

        // Force kill sau 10 giây nếu không thoát
        setTimeout(() => {
          worker.removeListener('exit', exitHandler);
          if (worker.isConnected()) {
            worker.kill('SIGKILL');
          }
          resolve();
        }, 10000);
      });
    });

  await Promise.all(shutdownPromises);

  // Đóng Redis connections
  await closeRedis();

  process.exit(0);
}

// Chạy main function
if (cluster.isPrimary || cluster.isMaster) {
  main().catch(error => {
    console.error('[Cluster Manager] Lỗi khi khởi động:', error);
    process.exit(1);
  });
} else {
  // Child process (worker) - load index.js
  // index.js sẽ tự động phát hiện CLUSTER_ID và SHARD_IDS từ env
  require('./index.js');
}

