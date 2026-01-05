import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../generated');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper function to get nested value from object by dot notation
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Helper function to set nested value in object by dot notation
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
  return obj;
}

// ============================================
// AUTO-SCAN COMPONENTS V2 EMBEDS
// ============================================

// Recursively get all JS files in a directory
function getAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, generated, .git
      if (!['node_modules', 'generated', '.git', 'web'].includes(file)) {
        getAllJsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

// Extract locale keys from a file content
function extractLocaleKeys(content) {
  const keys = new Set();
  
  // Pattern: lang.get('key') or lang.get("key")
  const langGetPattern = /lang\.get\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = langGetPattern.exec(content)) !== null) {
    keys.add(match[1]);
  }
  
  // Pattern: getText('key') or getText("key")
  const getTextPattern = /getText\s*\(\s*['"`]([^'"`]+)['"`]/g;
  while ((match = getTextPattern.exec(content)) !== null) {
    keys.add(match[1]);
  }
  
  // Pattern: t('key') or t("key") - common i18n pattern
  const tPattern = /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g;
  while ((match = tPattern.exec(content)) !== null) {
    keys.add(match[1]);
  }
  
  // Pattern: GT(guildId, locale, 'key') - project specific
  const gtPattern = /GT\s*\([^,]+,\s*[^,]+,\s*['"`]([^'"`]+)['"`]/g;
  while ((match = gtPattern.exec(content)) !== null) {
    keys.add(match[1]);
  }
  
  // Pattern: await GT(..., 'key')
  const gtAwaitPattern = /await\s+GT\s*\([^)]*['"`]([^'"`]+)['"`]/g;
  while ((match = gtAwaitPattern.exec(content)) !== null) {
    keys.add(match[1]);
  }
  
  return Array.from(keys);
}

// Detect if file uses Components V2
function usesComponentsV2(content) {
  return content.includes('EmbedComponentsV2') || 
         content.includes('createContainer') ||
         content.includes('ContainerBuilder') ||
         content.includes('addTextDisplay');
}

// Extract embed info from file
function extractEmbedInfo(content, filePath) {
  const embeds = [];
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  
  // Detect embed patterns
  const patterns = [
    // Pattern: addTextDisplay with lang.get for title
    /addTextDisplay\s*\(\s*`[^`]*\$\{lang\.get\s*\(\s*['"`]([^'"`]+)['"`]\s*\)\}[^`]*`\s*\)/g,
    // Pattern: lang.get for embed_title, embed_description, etc.
    /lang\.get\s*\(\s*['"`]([^'"`]*(?:embed_title|embed_description|embed_image|welcome_title|welcome_description|welcome_image|denied_title|denied_description|denied_image|ticket_embed_title|ticket_embed_description|ticket_embed_image|dm_embed_title|dm_embed_description|dm_embed_image)[^'"`]*)['"`]\s*\)/g,
    // Pattern: lang.get for button labels
    /lang\.get\s*\(\s*['"`]([^'"`]*(?:button_)[^'"`]*)['"`]\s*\)/g,
  ];
  
  const foundKeys = new Set();
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      foundKeys.add(match[1]);
    }
  }
  
  return {
    file: relativePath,
    usesV2: usesComponentsV2(content),
    localeKeys: Array.from(foundKeys)
  };
}

// Scan project and build template list
function scanProjectForEmbeds() {
  const projectRoot = path.join(__dirname, '..');
  const jsFiles = getAllJsFiles(projectRoot);
  const embedFiles = [];
  
  for (const file of jsFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const info = extractEmbedInfo(content, file);
      
      if (info.usesV2 && info.localeKeys.length > 0) {
        embedFiles.push(info);
      }
    } catch (err) {
      console.error(`Error reading file ${file}:`, err.message);
    }
  }
  
  return embedFiles;
}

// Group locale keys by category (e.g., ticket.setup, ticket.create)
function groupKeysByCategory(keys) {
  const groups = {};
  
  for (const key of keys) {
    // Extract category from key (e.g., "ticket.setup.embed_title" -> "ticket.setup")
    const parts = key.split('.');
    if (parts.length >= 2) {
      const category = parts.slice(0, -1).join('.');
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(key);
    }
  }
  
  return groups;
}

// Build template from grouped keys
function buildTemplatesFromScan(localeData) {
  const projectRoot = path.join(__dirname, '..');
  const jsFiles = getAllJsFiles(projectRoot);
  const allKeys = new Set();
  const fileKeyMap = {};
  
  // Scan all files for locale keys
  for (const file of jsFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      if (!usesComponentsV2(content)) continue;
      
      const relativePath = path.relative(projectRoot, file);
      const keys = extractLocaleKeys(content);
      
      // Filter keys that exist in locale and are embed-related
      const embedKeys = keys.filter(key => {
        const value = getNestedValue(localeData, key);
        return value !== undefined && (
          key.includes('embed_') || 
          key.includes('title') || 
          key.includes('description') ||
          key.includes('button_') ||
          key.includes('image') ||
          key.includes('welcome_') ||
          key.includes('denied_') ||
          key.includes('dm_embed') ||
          key.includes('ticket_embed') ||
          key.includes('_image')
        );
      });
      
      if (embedKeys.length > 0) {
        fileKeyMap[relativePath] = embedKeys;
        embedKeys.forEach(k => allKeys.add(k));
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }
  
  // Group keys by category
  const grouped = groupKeysByCategory(Array.from(allKeys));
  
  // Build templates
  const templates = [];
  
  for (const [category, keys] of Object.entries(grouped)) {
    // Check if this category has both ticket_embed and dm_embed keys
    const hasTicketEmbed = keys.some(k => k.includes('ticket_embed'));
    const hasDmEmbed = keys.some(k => k.includes('dm_embed'));
    
    // If both exist, split into two templates
    if (hasTicketEmbed && hasDmEmbed) {
      // Template for ticket embed
      const ticketKeys = keys.filter(k => !k.includes('dm_embed') && !k.includes('dm_success') && !k.includes('dm_failed'));
      if (ticketKeys.length > 0) {
        templates.push(buildSingleTemplate(category, ticketKeys, localeData, fileKeyMap, 'ticket'));
      }
      
      // Template for DM embed
      const dmKeys = keys.filter(k => k.includes('dm_embed'));
      if (dmKeys.length > 0) {
        templates.push(buildSingleTemplate(category + '.dm_user', dmKeys, localeData, fileKeyMap, 'dm'));
      }
    } else {
      templates.push(buildSingleTemplate(category, keys, localeData, fileKeyMap));
    }
  }
  
  return templates.sort((a, b) => a.id.localeCompare(b.id));
}

// Helper function to build a single template
function buildSingleTemplate(category, keys, localeData, fileKeyMap, type = null) {
  const templateKeys = {};
  const defaultValues = {};
  
  // Categorize keys
  for (const key of keys) {
    const shortKey = key.split('.').pop(); // e.g., "embed_title" from "ticket.setup.embed_title"
    templateKeys[shortKey] = key;
    
    const value = getNestedValue(localeData, key);
    if (value !== undefined) {
      defaultValues[shortKey] = value;
    }
  }
  
  // Determine template properties
  const categoryParts = category.split('.');
  const mainCategory = categoryParts[0]; // e.g., "ticket"
  const subCategory = categoryParts[1] || ''; // e.g., "setup"
  
  // Find which files use this category
  const sourceFiles = Object.entries(fileKeyMap)
    .filter(([file, fileKeys]) => fileKeys.some(k => keys.includes(k)))
    .map(([file]) => file);
  
  // Detect buttons
  const buttons = [];
  if (templateKeys.button_buy || templateKeys.button_buy_label) {
    buttons.push({ id: 'buy', style: 'primary', customId: 'ticket_create_buy' });
  }
  if (templateKeys.button_support || templateKeys.button_support_label) {
    buttons.push({ id: 'support', style: 'secondary', customId: 'ticket_create_support' });
  }
  if (templateKeys.button_close) {
    buttons.push({ id: 'close', style: 'danger', customId: 'ticket_close' });
  }
  if (templateKeys.button_delete) {
    buttons.push({ id: 'delete', style: 'danger', customId: 'ticket_delete' });
  }
  
  // Determine accent color based on category/type
  let accentColor = '#5865F2'; // Default blurple
  if (type === 'dm') {
    accentColor = '#5865F2'; // Blurple for DM
  } else if (subCategory === 'claim' || subCategory.includes('success')) {
    accentColor = '#23a55a'; // Green
  } else if (subCategory === 'close' || subCategory.includes('denied') || subCategory.includes('error')) {
    accentColor = '#ed4245'; // Red
  }
  
  // Create template name
  let templateName = categoryParts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' - ');
  
  // Add suffix for DM type
  if (type === 'dm') {
    templateName += ' (DM User)';
  } else if (type === 'ticket') {
    templateName += ' (Ticket Channel)';
  }
  
  return {
    id: category,
    name: templateName,
    description: type === 'dm' ? 'DM gửi cho user khi hoàn thành đơn' : `Auto-detected from ${sourceFiles.length} file(s)`,
    category: mainCategory,
    keys: templateKeys,
    accentColor,
    buttons,
    defaultValues,
    sourceFiles,
    embedType: type || 'default'
  };
}

// API Routes
app.get('/api/text-override', async (req, res) => {
  try {
    const { guildId, key } = req.query;

    if (!guildId || !key) {
      return res.status(400).json({ error: 'Missing guildId or key' });
    }

    const override = await prisma.guildTextOverride.findUnique({
      where: {
        guildId_key: { guildId, key }
      }
    });

    if (override) {
      res.json({ text: override.text });
    } else {
      res.json({ text: null });
    }
  } catch (error) {
    console.error('Error fetching text override:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/text-override', async (req, res) => {
  try {
    const { guildId, key, text } = req.body;

    if (!guildId || !key || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const override = await prisma.guildTextOverride.upsert({
      where: {
        guildId_key: { guildId, key }
      },
      update: { text },
      create: { guildId, key, text }
    });

    res.json({ success: true, data: override });
  } catch (error) {
    console.error('Error saving text override:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/text-override', async (req, res) => {
  try {
    const { guildId, key } = req.body;

    if (!guildId || !key) {
      return res.status(400).json({ error: 'Missing guildId or key' });
    }

    await prisma.guildTextOverride.delete({
      where: {
        guildId_key: { guildId, key }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting text override:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all overrides for a guild
app.get('/api/text-overrides/:guildId', async (req, res) => {
  try {
    const { guildId } = req.params;

    const overrides = await prisma.guildTextOverride.findMany({
      where: { guildId }
    });

    res.json(overrides);
  } catch (error) {
    console.error('Error fetching text overrides:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available locales
app.get('/api/locales', async (req, res) => {
  try {
    const localesDir = path.join(__dirname, '..', 'locales');
    const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
    const locales = files.map(f => f.replace('.json', ''));
    res.json(locales);
  } catch (error) {
    console.error('Error fetching locales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get locale data
app.get('/api/locale/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const localePath = path.join(__dirname, '..', 'locales', `${name}.json`);
    
    if (!fs.existsSync(localePath)) {
      return res.status(404).json({ error: 'Locale not found' });
    }
    
    const data = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
    res.json(data);
  } catch (error) {
    console.error('Error fetching locale:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific keys from locale (for Components V2 templates)
app.get('/api/locale/:name/keys', async (req, res) => {
  try {
    const { name } = req.params;
    const { keys } = req.query; // comma-separated keys like "ticket.setup.embed_title,ticket.setup.embed_description"
    
    const localePath = path.join(__dirname, '..', 'locales', `${name}.json`);
    
    if (!fs.existsSync(localePath)) {
      return res.status(404).json({ error: 'Locale not found' });
    }
    
    const data = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
    const keyList = keys ? keys.split(',') : [];
    
    const result = {};
    keyList.forEach(key => {
      const value = getNestedValue(data, key);
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching locale keys:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Components V2 template structure - AUTO SCAN from project
app.get('/api/componentsv2/templates', async (req, res) => {
  try {
    const { locale = 'Vietnamese' } = req.query;
    const localePath = path.join(__dirname, '..', 'locales', `${locale}.json`);
    
    if (!fs.existsSync(localePath)) {
      return res.status(404).json({ error: 'Locale not found' });
    }
    
    const localeData = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
    
    // Auto-scan project and build templates
    const templates = buildTemplatesFromScan(localeData);
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get scanned embed files info (for debugging/admin)
app.get('/api/componentsv2/scan', async (req, res) => {
  try {
    const embedFiles = scanProjectForEmbeds();
    res.json({
      totalFiles: embedFiles.length,
      files: embedFiles
    });
  } catch (error) {
    console.error('Error scanning project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get template data with guild overrides
app.get('/api/componentsv2/template/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { guildId, locale = 'Vietnamese' } = req.query;
    
    const localePath = path.join(__dirname, '..', 'locales', `${locale}.json`);
    
    if (!fs.existsSync(localePath)) {
      return res.status(404).json({ error: 'Locale not found' });
    }
    
    const localeData = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
    
    // Auto-scan and find template
    const templates = buildTemplatesFromScan(localeData);
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Get guild overrides if guildId provided
    let overrides = {};
    if (guildId) {
      const guildOverrides = await prisma.guildTextOverride.findMany({
        where: { guildId }
      });
      
      guildOverrides.forEach(override => {
        overrides[override.key] = override.text;
      });
    }
    
    // Build final values (locale defaults + guild overrides)
    const values = {};
    for (const [field, key] of Object.entries(template.keys)) {
      // Priority: guild override > locale default
      values[field] = overrides[key] || getNestedValue(localeData, key) || '';
    }
    
    res.json({
      template,
      values,
      hasOverrides: Object.keys(overrides).length > 0
    });
  } catch (error) {
    console.error('Error fetching template data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// STOCK CONFIG API (Flexible sections + buttons system)
// ============================================

// Get stock config for a guild
app.get('/api/stock-config/:guildId', async (req, res) => {
  try {
    const { guildId } = req.params;
    
    let config = await prisma.stockConfig.findUnique({
      where: { guildId }
    });
    
    // Return default config if not exists
    if (!config) {
      config = {
        guildId,
        enabled: true,
        sections: '[]',
        buttons: '[]',
        footer: '-# {guild.name} • {timestamp:f}'
      };
    }
    
    // Parse JSON fields
    res.json({
      ...config,
      sections: JSON.parse(config.sections || '[]'),
      buttons: JSON.parse(config.buttons || '[]')
    });
  } catch (error) {
    console.error('Error fetching stock config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save stock config for a guild
app.post('/api/stock-config/:guildId', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { sections, buttons, footer, enabled } = req.body;
    
    const config = await prisma.stockConfig.upsert({
      where: { guildId },
      update: {
        sections: JSON.stringify(sections || []),
        buttons: JSON.stringify(buttons || []),
        footer,
        enabled: enabled !== false
      },
      create: {
        guildId,
        sections: JSON.stringify(sections || []),
        buttons: JSON.stringify(buttons || []),
        footer,
        enabled: enabled !== false
      }
    });
    
    res.json({ 
      success: true, 
      data: {
        ...config,
        sections: JSON.parse(config.sections),
        buttons: JSON.parse(config.buttons)
      }
    });
  } catch (error) {
    console.error('Error saving stock config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available placeholders
app.get('/api/stock-config/placeholders', async (req, res) => {
  res.json({
    user: [
      { key: '{user}', description: 'Mention user' },
      { key: '{user.tag}', description: 'Username#0000' },
      { key: '{user.name}', description: 'Username' },
      { key: '{user.id}', description: 'User ID' },
      { key: '{user.avatar}', description: 'Avatar URL' },
    ],
    guild: [
      { key: '{guild.name}', description: 'Tên server' },
      { key: '{guild.id}', description: 'Server ID' },
      { key: '{guild.memberCount}', description: 'Số thành viên' },
      { key: '{guild.icon}', description: 'Icon URL' },
    ],
    time: [
      { key: '{timestamp}', description: 'Unix timestamp' },
      { key: '{timestamp:R}', description: 'Relative (2 hours ago)' },
      { key: '{timestamp:F}', description: 'Full date time' },
      { key: '{timestamp:f}', description: 'Short date time' },
      { key: '{timestamp:D}', description: 'Date only' },
      { key: '{timestamp:T}', description: 'Time only' },
      { key: '{date}', description: 'Ngày hiện tại' },
      { key: '{time}', description: 'Giờ hiện tại' },
    ],
    other: [
      { key: '{channel}', description: 'Mention channel hiện tại' },
    ]
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});

// Cleanup on exit
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
