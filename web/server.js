import express from 'express';
import cors from 'cors';
import path from 'path';
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
