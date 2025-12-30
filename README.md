# NewBot JS v1.2 🤖

Một Discord bot hiện đại được xây dựng bằng **Node.js + Discord.js v14**, tích hợp **Prisma ORM** và hệ thống **Embed Components V2** tiên tiến để quản lý server Discord một cách chuyên nghiệp và hiệu quả.

![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-active-success)
![Version](https://img.shields.io/badge/version-1.2.0-green)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Discord.js](https://img.shields.io/badge/discord.js-v14.14.1-blue)
![Prisma](https://img.shields.io/badge/prisma-v6.7.0-purple)
![Sharding](https://img.shields.io/badge/sharding-supported-success)
![Clustering](https://img.shields.io/badge/clustering-supported-success)
![Redis](https://img.shields.io/badge/redis--ipc-enabled-orange)

---

## 📚 Mục lục
- [Giới thiệu](-#giới-thiệu)
- [Tính năng](-#tính-năng)
- [Cấu trúc thư mục](-#cấu-trúc-thư-mục)
- [Cài đặt](-#cài-đặt)
- [Cấu hình](-#cấu-hình)
- [Cách sử dụng](-#cách-sử-dụng)
- [Embed Components V2](-#embed-components-v2)
- [API Reference](-#api-reference)
- [Đóng góp](-#đóng-góp)
- [Liên hệ](-#liên-hệ)
- [Giấy phép](-#giấy-phép)

---

## 📖 Giới thiệu

NewBot JS v1.2 là một Discord bot được thiết kế để quản lý server Discord với các tính năng nâng cao và giao diện đẹp mắt. Bot được xây dựng với kiến trúc modular, hỗ trợ đa ngôn ngữ và tích hợp database PostgreSQL thông qua Prisma ORM.

> Bot này giúp tự động hóa việc quản lý server Discord với hệ thống command linh hoạt,  
> Embed Components V2 với Builder Pattern, và hệ thống logging chuyên nghiệp.  
> Được phát triển bằng **Node.js + Discord.js v14 + Prisma**, có thể triển khai dễ dàng trên **VPS hoặc Docker**.

---

## ✨ Tính năng

### 🚀 **Core Features**
- ⚡ **Hệ thống Command linh hoạt** - Hỗ trợ cả Prefix và Slash Commands
- 🎨 **Embed Components V2** - Builder Pattern với Theme System và Animation
- 🌍 **Đa ngôn ngữ theo từng guild**  
  - Hỗ trợ tiếng Việt và tiếng Anh với i18n  
  - Lưu **language per guild** trong database (`GuildSettings.language`)
- 🗄️ **Database Integration** - PostgreSQL với Prisma ORM
- 📊 **Advanced Logging**  
  - Hệ thống log chuyên nghiệp với embed đẹp mắt  
  - Lưu **logChannelId per guild** trong database (`GuildSettings.logChannelId`)
  - Hỗ trợ **tùy biến text log per guild** qua bảng `GuildTextOverride`

### 🛠️ **Technical Features**
- 🧩 **Modular Architecture** - Cấu trúc code rõ ràng, dễ mở rộng
- ⚙️ **Configuration Management** - Cấu hình linh hoạt qua file JSON
- 🔄 **Auto-reload System** - Tự động reload commands khi development
- 🎯 **Event-driven** - Xử lý sự kiện Discord hiệu quả
- 📦 **Component System** - Buttons, Select Menus, Modals

### 🚀 **Advanced Features**
- 🔀 **Sharding Support** - Hỗ trợ phân chia bot thành multiple shards để xử lý nhiều guilds
- ⚡ **Clustering** - Chạy bot trên nhiều processes/clusters để tối ưu hiệu suất
- 📡 **Redis IPC** - Giao tiếp giữa các clusters thông qua Redis cho scalability
- 🔄 **Auto Update** - Tự động restart tất cả clusters khi file source code thay đổi

### 🎨 **UI/UX Features**
- 🌈 **Theme System** - Dark, Default, Neon themes
- 🎬 **Animation Support** - Loading animations và dynamic content
- 📱 **Responsive Design** - Embed responsive trên mọi thiết bị
- 🎭 **Interactive Components** - Pagination, Cards, Progress bars

---

## 🗂️ Cấu trúc thư mục

```bash
📦 NewBot JS v1.2
├── 📁 commands/              # Hệ thống commands
│   └── 📁 prefix/            # Prefix commands
│       ├── 📁 Dev/           # Developer commands
│       ├── 📁 Owner/         # Owner commands  
│       ├── 📁 Server/        # Server management
│       └── 📁 Settings/      # Bot settings
├── 📁 events/                # Event handlers
│   ├── commandResponse.js    # Command response handler
│   ├── slashCommandResponse.js # Slash command handler
│   ├── interactionCreate.js  # Interaction handler
│   └── ...                   # Other events
├── 📁 handler/               # Specialized handlers
│   ├── 📁 Contexthandler/    # Context menu handlers
│   ├── 📁 Menuhandler/       # Menu handlers
│   └── 📁 Modalhandler/      # Modal handlers
├── 📁 utils/                 # Utility functions
│   ├── embedComponentsV2.js # 🆕 Embed V2 System
│   ├── embedUtils.js         # Legacy embed utils
│   ├── functions.js          # General utilities
│   ├── prisma.js            # Database utilities
│   └── ...                  # Other utilities
├── 📁 locales/              # Language files
│   ├── Vietnamese.json       # Tiếng Việt
│   └── English.json         # English
├── 📁 prisma/               # Database schema
│   └── schema.prisma        # Prisma schema
├── 📁 plugins/              # Plugin system
│   └── i18n.js              # Internationalization
├── 📁 buttons/              # Button handlers
├── 📁 utils/                # Utility functions
│   ├── redis.js             # 🆕 Redis IPC client
│   └── ...                  # Other utilities
├── 📄 index.js              # Main entry point (supports cluster/shard)
├── 📄 cluster.js            # 🆕 Cluster Manager với Redis IPC & Auto-reload
├── 📄 shard.js              # 🆕 Shard Manager
├── 📄 config.json           # Bot configuration
├── 📄 package.json          # Dependencies
└── 📄 README.md             # Documentation
```

---

## 🚀 Cài đặt

### **Yêu cầu hệ thống**
- Node.js v16+ 
- PostgreSQL database
- Discord Bot Token
- (Optional) Redis server - Cần thiết khi bật clustering với Redis IPC

### **Bước 1: Clone repository**
```bash
git clone https://github.com/your-username/newbotjsv1.2.git
cd newbotjsv1.2
```

### **Bước 2: Cài đặt dependencies**
```bash
npm install
```

### **Bước 3: Cấu hình database**
Tạo file `.env` và cập nhật thông tin kết nối:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/discordbot?schema=public"
```

### **Bước 4: Cấu hình bot**
Cập nhật `config.json`:
```json
{
  "token": "YOUR_BOT_TOKEN",
  "clientId": "YOUR_CLIENT_ID",
  "defaultLanguage": "Vietnamese",
  "embedColor": "#3498db",
  "DevID": "YOUR_DISCORD_ID",
  "debug": false,
  "logChannelId": "LOG_CHANNEL_ID"
}
```

### **Bước 5: Setup database**
```bash
# Tạo migration
npx prisma migrate dev --name init

# Push schema to database
npx prisma db push

# (Optional) Xem dữ liệu với Prisma Studio
npx prisma studio
```

### **Bước 6: Deploy commands**
```bash
# Deploy slash commands
node deploy.js

# Hoặc deploy global
node deploy-global.js
```

### **Bước 7: Chạy bot**
```bash
# Production (tự động route dựa trên config.json)
npm start

# Development với auto-reload
npm run dev

# Chỉ chạy sharding (không clustering)
npm run shard

# Chạy trực tiếp index.js (không cluster/shard)
npm run bot
```

### **🆕 Sharding & Clustering Setup**

#### **Bật Sharding:**
Chỉnh sửa `config.json`:
```json
{
  "sharding": true,
  "clustering": false
}
```
Sau đó chạy: `npm start` hoặc `npm run shard`

#### **Bật Clustering:**
Chỉnh sửa `config.json`:
```json
{
  "sharding": true,
  "clustering": true,
  "cluster": {
    "totalShards": "auto",
    "shardsPerCluster": 2,
    "totalClusters": "auto"
  },
  "redis": {
    "host": "localhost",
    "port": 6379
  }
}
```

**Lưu ý:** 
- Khi bật clustering, bạn cần chạy Redis server
- `totalShards: "auto"` sẽ tự động lấy số shards được đề xuất từ Discord API
- `totalClusters: "auto"` sẽ tự động tính dựa trên số CPU cores và shards
- Clustering sẽ tự động chia shards cho các clusters

#### **Auto Reload:**
Khi `autoReload: true`, bot sẽ tự động restart tất cả clusters khi phát hiện file `.js` thay đổi. Tính năng này sử dụng `chokidar` để watch files.

---

## ⚙️ Cấu hình

### **Environment Variables**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/discordbot"
```

### **Bot Configuration (config.json)**
```json
{
  "token": "Bot token từ Discord Developer Portal",
  "clientId": "Application ID của bot",
  "defaultLanguage": "Vietnamese",          // Ngôn ngữ mặc định nếu guild chưa set trong DB
  "embedColor": "#3498db",
  "DevID": "Discord ID của developer",
  "debug": false,
  "logChannelId": "Channel ID để gửi logs (tùy chọn, có thể override per guild trong DB)",
  
  // 🆕 Sharding & Clustering
  "sharding": false,        // Bật/tắt sharding
  "clustering": false,      // Bật/tắt clustering
  "cluster": {
    "totalShards": "auto",  // "auto" hoặc số cụ thể
    "shardsPerCluster": 2,  // Số shards mỗi cluster
    "totalClusters": "auto" // "auto" hoặc số cụ thể
  },
  
  // 🆕 Redis IPC Configuration
  "redis": {
    "host": "localhost",
    "port": 6379,
    "password": "",
    "db": 0
  },
  
  // 🆕 Auto Reload Configuration
  "autoReload": true,       // Bật/tắt auto-reload khi file thay đổi
  "watchFiles": ["**/*.js"] // Patterns để watch files
}
```

### **Database Schema**
Bot sử dụng Prisma với các bảng chính:
- `DisabledCommand` - Commands bị vô hiệu hóa (toàn cục / theo guild / theo channel)
- `GuildSettings` - Cài đặt server (prefix, language, logChannelId, v.v.)
- `GuildTextOverride` - Text i18n override theo từng guild + key (ưu tiên hơn file trong `locales/`)

---

## 🎮 Cách sử dụng

### **🆕 Sharding & Clustering**

#### **Chế độ hoạt động:**

1. **Standalone Mode** (mặc định):
   - `sharding: false` và `clustering: false`
   - Bot chạy trực tiếp trên 1 process
   - Không cần Redis
   - Phù hợp cho bots nhỏ (< 2500 servers)

2. **Sharding Mode**:
   - `sharding: true` và `clustering: false`
   - Bot được chia thành multiple shards
   - Tự động quản lý bởi Discord.js ShardingManager
   - Phù hợp cho bots vừa (2500-50000 servers)

3. **Clustering Mode** (Khuyến nghị cho production):
   - `sharding: true` và `clustering: true`
   - Bot chạy trên nhiều processes/clusters
   - Mỗi cluster quản lý một nhóm shards
   - Giao tiếp qua Redis IPC
   - Tự động restart khi file thay đổi
   - Phù hợp cho bots lớn (> 50000 servers)

#### **Redis IPC:**
Khi bật clustering, các clusters sẽ giao tiếp với nhau thông qua Redis:
- **Channel:** `bot:ipc`
- **Message Types:**
  - `broadcast`: Gửi message đến tất cả clusters
  - `restart`: Yêu cầu restart tất cả clusters

#### **Auto Reload:**
- Tự động watch tất cả file `.js` trong project
- Khi file thay đổi, đợi 2 giây (debounce) rồi restart tất cả clusters
- Clear require cache trước khi restart
- Phù hợp cho development

---

### **Prefix Commands**
```bash
# Server info
!server

# Ping bot
!ping

# Help
!help

# Language settings
!language vietnamese
!language english
```

### **Slash Commands**
```bash
# Server information
/server

# Ping bot
/ping

# Help
/help
```

### **Developer Commands**
```bash
# Reload commands
!reload

# Restart bot
!restart

# Enable/Disable commands
!enable <command>
!disable <command>
```

---

## 🎨 Embed Components V2

### **Tính năng chính**
- 🏗️ **Builder Pattern** - Tạo embed với cú pháp chain
- 🎨 **Theme System** - Dark, Default, Neon themes
- 🎬 **Animation Support** - Loading animations
- 📱 **Component Integration** - Buttons, Select Menus, Modals
- 🃏 **Card System** - User, Server, Command cards
- 📄 **Pagination** - Phân trang tự động
- 🎯 **Interactive Components** - Confirmation, Settings, Progress

### **Ví dụ sử dụng**

#### **Basic Embed**
```javascript
const { EmbedComponentsV2 } = require('./utils/embedComponentsV2');

const embed = EmbedComponentsV2.createBuilder('dark')
  .setTitle('🎉 Welcome!')
  .setDescription('Chào mừng đến với server!')
  .setColor('#7289da')
  .setThumbnail(user.displayAvatarURL())
  .addField('User', user.tag, true)
  .addField('Server', guild.name, true)
  .setTimestamp()
  .build();
```

#### **Interactive Components**
```javascript
// Confirmation dialog
const confirmation = EmbedComponentsV2.createInteractive('dark')
  .createConfirmation(
    'Xóa Server',
    'Bạn có chắc chắn muốn xóa server này không?',
    'Xóa',
    'Hủy'
  );

// Progress bar
const progress = EmbedComponentsV2.createInteractive('default')
  .createProgressBar(75, 100, 'Download Progress', true);
```

#### **Pagination**
```javascript
const pagination = EmbedComponentsV2.createPagination(users, 10, 'dark')
  .setFormatter((user, index) => `${index}. **${user.username}**`)
  .setOptions({
    title: '👥 Danh sách Users',
    color: '#7289da'
  })
  .build();
```

### **Available Themes**
- `default` - Theme mặc định với màu xanh
- `dark` - Theme tối với màu Discord
- `neon` - Theme neon với màu sắc rực rỡ

### **Animation Types**
- `loading` - Loading spinner
- `dots` - Dots animation
- `pulse` - Pulse effect
- `wave` - Wave animation
- `bounce` - Bounce effect
- `spin` - Spin animation

---

## 📖 API Reference

### **EmbedComponentsV2**
```javascript
// Create builder
const builder = EmbedComponentsV2.createBuilder(theme);

// Create components
const card = EmbedComponentsV2.createCard(theme);
const pagination = EmbedComponentsV2.createPagination(items, itemsPerPage, theme);
const interactive = EmbedComponentsV2.createInteractive(theme);

// Quick methods
const success = EmbedComponentsV2.quickSuccess(title, description, theme);
const error = EmbedComponentsV2.quickError(title, description, theme);
```

### **Functions Utils**
```javascript
const { 
  createEmbedV2, 
  createCard, 
  createPagination,
  createInteractive 
} = require('./utils/functions');

// Usage
const embed = createEmbedV2('dark');
const userCard = createCard('default').userCard(user);
```

---

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Để đóng góp:

1. **Fork** repository
2. **Tạo branch** cho feature mới (`git checkout -b feature/AmazingFeature`)
3. **Commit** changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** lên branch (`git push origin feature/AmazingFeature`)
5. **Tạo Pull Request**

### **Guidelines**
- Tuân thủ code style hiện tại
- Thêm comments cho code phức tạp
- Test kỹ trước khi submit
- Cập nhật documentation nếu cần

---

## 📞 Liên hệ

**Tác giả:** Quang Sáng  
**Email:** sangnekk2007@gmail.com  
**Website:** https://sangnguyen07.io.vn  
**Discord:** [Thêm Discord tag nếu có]

### **Hỗ trợ**
- 📧 Email: sangnekk2007@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/newbotjsv1.2/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/newbotjsv1.2/discussions)

---

## 📄 Giấy phép

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

```
MIT License

Copyright (c) 2024 Quang Sáng

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">
  <strong>⭐ Nếu dự án này hữu ích, hãy cho chúng tôi một star! ⭐</strong>
</div>