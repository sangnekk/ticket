/**
 * Ví dụ sử dụng Embed Components V2
 * File này demo các tính năng của hệ thống embed v2 mới
 */

const { EmbedComponentsV2 } = require('./utils/embedComponentsV2');
const { createEmbedV2, createCard, createPagination, createInteractive } = require('./utils/functions');

// ===== VÍ DỤ SỬ DỤNG EMBED BUILDER V2 =====

// 1. Tạo embed cơ bản với theme
function createBasicEmbed() {
  const builder = createEmbedV2('dark');
  
  return builder
    .setTitle('🎉 Chào mừng đến với Embed V2!')
    .setDescription('Đây là hệ thống embed mới với nhiều tính năng nâng cao')
    .setColor('#7289da')
    .setThumbnail('https://example.com/avatar.png')
    .setFooter({ text: 'Embed V2 Demo', iconURL: 'https://example.com/icon.png' })
    .setTimestamp()
    .addField('Tính năng', 'Builder Pattern', true)
    .addField('Theme', 'Dark Mode', true)
    .addField('Animation', 'Hỗ trợ', true)
    .build();
}

// 2. Tạo embed với buttons
function createEmbedWithButtons() {
  const builder = createEmbedV2('neon');
  
  return builder
    .setTitle('🎮 Game Panel')
    .setDescription('Chọn hành động bạn muốn thực hiện:')
    .setColor('#00ffff')
    .addButton('Play', 'game_play', 'Success', { emoji: '▶️' })
    .addButton('Settings', 'game_settings', 'Secondary', { emoji: '⚙️' })
    .addButton('Help', 'game_help', 'Primary', { emoji: '❓' })
    .addButton('Quit', 'game_quit', 'Danger', { emoji: '❌' })
    .build();
}

// 3. Tạo embed với select menu
function createEmbedWithSelect() {
  const builder = createEmbedV2('default');
  
  const selectOptions = [
    { label: 'English', value: 'en', description: 'English language' },
    { label: 'Tiếng Việt', value: 'vi', description: 'Vietnamese language' },
    { label: '日本語', value: 'ja', description: 'Japanese language' },
    { label: '한국어', value: 'ko', description: 'Korean language' },
  ];
  
  return builder
    .setTitle('🌍 Language Selection')
    .setDescription('Chọn ngôn ngữ bạn muốn sử dụng:')
    .setColor('#3498db')
    .addSelectMenu('lang_select', 'Select a language...', selectOptions, 1, 1)
    .build();
}

// 4. Tạo embed với animation
function createAnimatedEmbed() {
  const builder = createEmbedV2('default');
  
  return builder
    .setTitle('⏳ Loading...')
    .setDescription('Đang tải dữ liệu, vui lòng chờ...')
    .setColor('#95a5a6')
    .startAnimation('loading', 500)
    .build();
}

// ===== VÍ DỤ SỬ DỤNG CARD COMPONENT =====

// 5. Tạo user card
function createUserCard(user) {
  const card = createCard('dark');
  
  return card.userCard(user, {
    showAvatar: true,
    showStatus: true,
    showActivity: true,
    showJoinDate: true,
    showRoles: true,
    maxRoles: 5
  });
}

// 6. Tạo server card
function createServerCard(guild) {
  const card = createCard('neon');
  
  return card.serverCard(guild, {
    showIcon: true,
    showBanner: false,
    showFeatures: true,
    showChannels: true,
    showMembers: true
  });
}

// 7. Tạo command card
function createCommandCard(command) {
  const card = createCard('default');
  
  return card.commandCard(command, 'Vietnamese');
}

// ===== VÍ DỤ SỬ DỤNG PAGINATION COMPONENT =====

// 8. Tạo pagination cho danh sách users
function createUsersPagination(users) {
  const pagination = createPagination(users, 5, 'dark');
  
  pagination.setFormatter((user, index) => {
    return `${index}. **${user.username}** (${user.id})`;
  });
  
  pagination.setOptions({
    title: '👥 Danh sách Users',
    color: '#7289da',
    thumbnail: 'https://example.com/users-icon.png'
  });
  
  return pagination.build();
}

// 9. Tạo pagination cho danh sách commands
function createCommandsPagination(commands) {
  const pagination = createPagination(commands, 8, 'default');
  
  pagination.setFormatter((command, index) => {
    return `${index}. \`${command.name}\` - ${command.description || 'No description'}`;
  });
  
  pagination.setOptions({
    title: '📝 Danh sách Commands',
    color: '#3498db'
  });
  
  return pagination.build();
}

// ===== VÍ DỤ SỬ DỤNG INTERACTIVE COMPONENT =====

// 10. Tạo confirmation dialog
function createConfirmationDialog() {
  const interactive = createInteractive('dark');
  
  return interactive.createConfirmation(
    'Xóa Server',
    'Bạn có chắc chắn muốn xóa server này không? Hành động này không thể hoàn tác!',
    'Xóa',
    'Hủy'
  );
}

// 11. Tạo settings panel
function createSettingsPanel() {
  const interactive = createInteractive('neon');
  
  const settings = [
    { key: 'welcome_message', name: 'Welcome Message', description: 'Gửi tin nhắn chào mừng', default: true },
    { key: 'auto_moderation', name: 'Auto Moderation', description: 'Tự động kiểm duyệt tin nhắn', default: false },
    { key: 'music_player', name: 'Music Player', description: 'Cho phép phát nhạc', default: true },
    { key: 'level_system', name: 'Level System', description: 'Hệ thống cấp độ', default: false },
  ];
  
  const currentValues = {
    welcome_message: true,
    auto_moderation: false,
    music_player: true,
    level_system: false
  };
  
  return interactive.createSettingsPanel(settings, currentValues);
}

// 12. Tạo progress bar
function createProgressBar(current, max) {
  const interactive = createInteractive('default');
  
  return interactive.createProgressBar(current, max, 'Download Progress', true);
}

// 13. Tạo leaderboard
function createLeaderboard() {
  const interactive = createInteractive('dark');
  
  const players = [
    { name: 'Player1', score: 1500, level: 25 },
    { name: 'Player2', score: 1200, level: 20 },
    { name: 'Player3', score: 1000, level: 18 },
    { name: 'Player4', score: 800, level: 15 },
    { name: 'Player5', score: 600, level: 12 },
  ];
  
  const formatter = (player, index) => {
    return `${index}. **${player.name}** - ${player.score} points (Level ${player.level})`;
  };
  
  return interactive.createLeaderboard(players, '🏆 Top Players', formatter);
}

// ===== VÍ DỤ SỬ DỤNG MODAL =====

// 14. Tạo feedback modal
function createFeedbackModal() {
  const builder = createEmbedV2('default');
  
  const inputs = [
    {
      customId: 'feedback_type',
      label: 'Loại phản hồi',
      style: 'Short',
      placeholder: 'Bug report, Feature request, etc.',
      required: true,
      maxLength: 50
    },
    {
      customId: 'feedback_title',
      label: 'Tiêu đề',
      style: 'Short',
      placeholder: 'Mô tả ngắn gọn',
      required: true,
      maxLength: 100
    },
    {
      customId: 'feedback_description',
      label: 'Mô tả chi tiết',
      style: 'Paragraph',
      placeholder: 'Mô tả chi tiết về phản hồi của bạn...',
      required: true,
      maxLength: 1000
    },
    {
      customId: 'feedback_contact',
      label: 'Thông tin liên hệ (tùy chọn)',
      style: 'Short',
      placeholder: 'Discord tag hoặc email',
      required: false,
      maxLength: 100
    }
  ];
  
  return builder.addModal('📝 Gửi Phản Hồi', 'feedback_modal', inputs);
}

// ===== VÍ DỤ SỬ DỤNG QUICK METHODS =====

// 15. Sử dụng quick methods
function createQuickEmbeds() {
  const successEmbed = EmbedComponentsV2.quickSuccess('Thành công!', 'Thao tác đã được thực hiện thành công.', 'dark');
  const errorEmbed = EmbedComponentsV2.quickError('Lỗi!', 'Đã xảy ra lỗi trong quá trình thực hiện.', 'dark');
  const warningEmbed = EmbedComponentsV2.quickWarning('Cảnh báo!', 'Vui lòng kiểm tra lại thông tin.', 'dark');
  const infoEmbed = EmbedComponentsV2.quickInfo('Thông tin', 'Đây là thông tin quan trọng.', 'dark');
  const loadingEmbed = EmbedComponentsV2.quickLoading('Đang tải...', 'Vui lòng chờ trong giây lát.', 'dark');
  
  return {
    success: successEmbed,
    error: errorEmbed,
    warning: warningEmbed,
    info: infoEmbed,
    loading: loadingEmbed
  };
}

// ===== VÍ DỤ SỬ DỤNG THEME SYSTEM =====

// 16. Demo các theme khác nhau
function createThemeDemo() {
  const themes = ['default', 'dark', 'neon'];
  const demos = {};
  
  themes.forEach(theme => {
    const builder = createEmbedV2(theme);
    demos[theme] = builder
      .setTitle(`🎨 Theme: ${theme.toUpperCase()}`)
      .setDescription(`Đây là ví dụ về theme ${theme}`)
      .setColor(EmbedComponentsV2.themes[theme].colors.primary)
      .setTimestamp()
      .build();
  });
  
  return demos;
}

// ===== VÍ DỤ SỬ DỤNG ANIMATION SYSTEM =====

// 17. Demo các loại animation
function createAnimationDemo() {
  const animations = ['loading', 'dots', 'pulse', 'wave', 'bounce', 'spin'];
  const demos = {};
  
  animations.forEach(animation => {
    const builder = createEmbedV2('default');
    demos[animation] = builder
      .setTitle(`🎬 Animation: ${animation}`)
      .setDescription(`Đây là ví dụ về animation ${animation}`)
      .setColor('#3498db')
      .startAnimation(animation, 800)
      .build();
  });
  
  return demos;
}

// Export tất cả các ví dụ
module.exports = {
  // Basic embeds
  createBasicEmbed,
  createEmbedWithButtons,
  createEmbedWithSelect,
  createAnimatedEmbed,
  
  // Card components
  createUserCard,
  createServerCard,
  createCommandCard,
  
  // Pagination components
  createUsersPagination,
  createCommandsPagination,
  
  // Interactive components
  createConfirmationDialog,
  createSettingsPanel,
  createProgressBar,
  createLeaderboard,
  
  // Modal components
  createFeedbackModal,
  
  // Quick methods
  createQuickEmbeds,
  
  // Theme and animation demos
  createThemeDemo,
  createAnimationDemo,
};
