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

// Get Components V2 template structure from locale
app.get('/api/componentsv2/templates', async (req, res) => {
  try {
    const { locale = 'Vietnamese' } = req.query;
    const localePath = path.join(__dirname, '..', 'locales', `${locale}.json`);
    
    if (!fs.existsSync(localePath)) {
      return res.status(404).json({ error: 'Locale not found' });
    }
    
    const data = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
    
    // Define template structure based on actual bot commands
    const templates = [
      {
        id: 'ticket.setup',
        name: 'Ticket Setup',
        description: 'Container hiển thị khi setup ticket',
        category: 'ticket',
        keys: {
          title: 'ticket.setup.embed_title',
          description: 'ticket.setup.embed_description',
          image: 'ticket.setup.embed_image',
          button_buy_label: 'ticket.setup.button_buy',
          button_buy_emoji: 'ticket.setup.button_buy_emoji',
          button_support_label: 'ticket.setup.button_support',
          button_support_emoji: 'ticket.setup.button_support_emoji',
        },
        accentColor: '#5865F2',
        buttons: [
          { id: 'buy', style: 'primary', customId: 'ticket_create_buy' },
          { id: 'support', style: 'secondary', customId: 'ticket_create_support' }
        ]
      },
      {
        id: 'ticket.create.welcome',
        name: 'Ticket Welcome',
        description: 'Container chào mừng khi tạo ticket',
        category: 'ticket',
        keys: {
          title: 'ticket.create.welcome_title',
          description: 'ticket.create.welcome_description',
          image: 'ticket.create.welcome_image',
        },
        accentColor: '#5865F2',
        buttons: []
      },
      {
        id: 'ticket.claim',
        name: 'Ticket Claimed',
        description: 'Container khi staff claim ticket',
        category: 'ticket',
        keys: {
          title: 'ticket.claim.embed_title',
          description: 'ticket.claim.embed_description',
          image: 'ticket.claim.embed_image',
        },
        accentColor: '#00FF00',
        buttons: []
      },
      {
        id: 'ticket.close.denied',
        name: 'Ticket Close Denied',
        description: 'Container từ chối đóng ticket',
        category: 'ticket',
        keys: {
          title: 'ticket.close.denied_title',
          description: 'ticket.close.denied_description',
          image: 'ticket.close.denied_image',
        },
        accentColor: '#FF0000',
        buttons: []
      },
      {
        id: 'ticket.dm.ticket',
        name: 'DM - Ticket Embed',
        description: 'Container gửi vào ticket khi hoàn thành',
        category: 'ticket',
        keys: {
          title: 'ticket.dm.ticket_embed_title',
          description: 'ticket.dm.ticket_embed_description',
        },
        accentColor: '#00FF00',
        buttons: []
      },
      {
        id: 'ticket.dm.user',
        name: 'DM - User Embed',
        description: 'Container gửi DM cho user',
        category: 'ticket',
        keys: {
          title: 'ticket.dm.dm_embed_title',
          description: 'ticket.dm.dm_embed_description',
        },
        accentColor: '#5865F2',
        buttons: []
      }
    ];
    
    // Populate default values from locale
    const populatedTemplates = templates.map(template => {
      const defaultValues = {};
      
      for (const [field, key] of Object.entries(template.keys)) {
        const value = getNestedValue(data, key);
        if (value !== undefined) {
          defaultValues[field] = value;
        }
      }
      
      return {
        ...template,
        defaultValues
      };
    });
    
    res.json(populatedTemplates);
  } catch (error) {
    console.error('Error fetching templates:', error);
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
    
    // Get template structure
    const templatesRes = await fetch(`http://localhost:${PORT}/api/componentsv2/templates?locale=${locale}`);
    const templates = await templatesRes.json();
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
