const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 80;

// Middleware
app.use(cors());
app.use(express.static('.'));

// Load configuration
let config = {};
try {
  config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (error) {
  console.error('Error loading config.json:', error.message);
  process.exit(1);
}

const defaultSectionConfig = {
  currentHunt: true,
  failedAttempts: false,
  lastShiny: true,
  livingDex: false,
};

function getSectionConfig() {
  const sectionConfig = config.sections && typeof config.sections === 'object'
    ? config.sections
    : {};

  return Object.entries({ ...defaultSectionConfig, ...sectionConfig }).reduce(
    (acc, [key, value]) => {
      acc[key] = Boolean(value);
      return acc;
    },
    {}
  );
}

// API endpoint to get counter value
app.get('/api/counter', (req, res) => {
  try {
    const counterPath = config.counterFilePath;
    
    if (!counterPath) {
      return res.status(500).json({ error: 'Counter file path not configured' });
    }

    // Check if file exists
    if (!fs.existsSync(counterPath)) {
      return res.status(404).json({ error: 'Counter file not found' });
    }

    // Read counter value
    const counterValue = fs.readFileSync(counterPath, 'utf8').trim();
    res.json({ count: counterValue });
  } catch (error) {
    console.error('Error reading counter file:', error.message);
    res.status(500).json({ error: 'Failed to read counter file' });
  }
});

// API endpoint to get Pokemon image info
app.get('/api/pokemon', (req, res) => {
  try {
    const pokemonImage = config.pokemonImage;
    
    if (!pokemonImage) {
      return res.status(500).json({ error: 'Pokemon image path not configured' });
    }

    // Check if image file exists
    if (!fs.existsSync(pokemonImage)) {
      return res.status(404).json({ error: 'Pokemon image not found' });
    }

    res.json({ imagePath: pokemonImage });
  } catch (error) {
    console.error('Error reading Pokemon image:', error.message);
    res.status(500).json({ error: 'Failed to read Pokemon image' });
  }
});

// API endpoint to get failed catches counter
app.get('/api/failed-catches', (req, res) => {
  try {
    const failedCatchesPath = config.failedCatchesFilePath;
    
    if (!failedCatchesPath) {
      return res.status(500).json({ error: 'Failed catches file path not configured' });
    }

    // Check if file exists
    if (!fs.existsSync(failedCatchesPath)) {
      return res.status(404).json({ error: 'Failed catches file not found' });
    }

    // Read failed catches value
    const failedCatchesValue = fs.readFileSync(failedCatchesPath, 'utf8').trim();
    res.json({ count: failedCatchesValue });
  } catch (error) {
    console.error('Error reading failed catches file:', error.message);
    res.status(500).json({ error: 'Failed to read failed catches file' });
  }
});

// API endpoint to get section configuration
app.get('/api/config/sections', (_req, res) => {
  try {
    res.json({ sections: getSectionConfig() });
  } catch (error) {
    console.error('Error serving section configuration:', error.message);
    res.status(500).json({ error: 'Failed to load section configuration' });
  }
});

// API endpoint to get last shiny Pokemon image info
app.get('/api/last-shiny', (req, res) => {
  try {
    const lastShinyImage = config.lastShinyImage;
    
    if (!lastShinyImage || lastShinyImage === '') {
      return res.json({ imagePath: '' });
    }

    // Check if image file exists
    if (!fs.existsSync(lastShinyImage)) {
      return res.status(404).json({ error: 'Last shiny image not found' });
    }

    res.json({ imagePath: lastShinyImage });
  } catch (error) {
    console.error('Error reading last shiny image:', error.message);
    res.status(500).json({ error: 'Failed to read last shiny image' });
  }
});

// API endpoint to get living dex info
app.get('/api/living-dex', (req, res) => {
  try {
    const sections = getSectionConfig();
    if (!sections.livingDex) {
      return res.status(404).json({ error: 'Living dex section disabled' });
    }

    const livingDexCountPath = config.livingDexCount;
    const livingDexTotalRaw = config.livingDexTotal;

    if (!livingDexCountPath) {
      return res.status(500).json({ error: 'Living dex count file path not configured' });
    }

    const livingDexTotal = Number(livingDexTotalRaw);
    if (!Number.isFinite(livingDexTotal) || livingDexTotal < 0) {
      return res.status(500).json({ error: 'Living dex total must be a non-negative number' });
    }

    if (!fs.existsSync(livingDexCountPath)) {
      return res.status(404).json({ error: 'Living dex count file not found' });
    }

    const rawCount = fs.readFileSync(livingDexCountPath, 'utf8').trim();
    const livingDexCount = parseInt(rawCount, 10);

    if (Number.isNaN(livingDexCount) || livingDexCount < 0) {
      return res.status(500).json({ error: 'Living dex count file must contain a non-negative integer' });
    }

    res.json({ count: livingDexCount, total: livingDexTotal });
  } catch (error) {
    console.error('Error reading living dex data:', error.message);
    res.status(500).json({ error: 'Failed to read living dex data' });
  }
});

app.listen(PORT, () => {
  console.log(`Pokemon Shiny Hunt Tracker server running on http://shiny.local`);
  console.log('Add this URL as a link source in TikTok Live Studio');
  console.log(`Counter file: ${config.counterFilePath || 'Not configured'}`);
  console.log(`Pokemon image: ${config.pokemonImage || 'Not configured'}`);
  console.log(`Sections: ${JSON.stringify(getSectionConfig())}`);
});
