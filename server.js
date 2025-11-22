const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const app = express();
const PORT = 80;

// Detect if running as pkg executable
const isPkg = typeof process.pkg !== 'undefined';
const basePath = isPkg ? path.dirname(process.execPath) : __dirname;

// Middleware
app.use(cors());

// Handle static file serving
// When running as pkg, bundled assets (HTML, CSS, JS) are in the snapshot filesystem
// External files (user images, txt files) should be in basePath
if (isPkg) {
  // Serve bundled web files from snapshot filesystem
  app.use(express.static(__dirname));
  // Also serve external files from executable directory (user's img/, txt/ folders)
  app.use(express.static(basePath));
} else {
  app.use(express.static('.'));
}

// Configuration defaults
const defaultSectionConfig = {
  currentHunt: true,
  failedAttempts: false,
  lastShiny: true,
  livingDex: false,
};

// Helper function to resolve file paths (handles relative paths from basePath)
function resolvePath(filePath) {
  if (!filePath) return null;
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.resolve(basePath, filePath);
}

// Helper function to check if hosts file entry exists
async function checkHostsEntry() {
  try {
    const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
    const hostsContent = fs.readFileSync(hostsPath, 'utf8');
    return hostsContent.includes('127.0.0.1 shiny.local') || hostsContent.includes('127.0.0.1\tshiny.local');
  } catch (error) {
    return false;
  }
}

// Helper function to add hosts file entry (requires admin elevation)
async function addHostsEntry() {
  try {
    const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
    const entry = '\n127.0.0.1 shiny.local';
    
    // Check if already exists
    if (await checkHostsEntry()) {
      console.log('✓ Hosts file entry already exists');
      return true;
    }

    // Use PowerShell to append to hosts file (requires admin)
    const command = `powershell -Command "Start-Process powershell -ArgumentList '-Command', 'Add-Content -Path ''${hostsPath}'' -Value ''${entry}'' -Force' -Verb RunAs -Wait"`;
    
    await execAsync(command);
    
    // Verify it was added
    if (await checkHostsEntry()) {
      console.log('✓ Hosts file entry added successfully');
      return true;
    } else {
      console.warn('⚠ Failed to add hosts file entry. You may need to add it manually.');
      console.warn('  Add this line to C:\\Windows\\System32\\drivers\\etc\\hosts:');
      console.warn('  127.0.0.1 shiny.local');
      return false;
    }
  } catch (error) {
    console.warn('⚠ Failed to automatically add hosts file entry:', error.message);
    console.warn('  Please add this line to C:\\Windows\\System32\\drivers\\etc\\hosts manually:');
    console.warn('  127.0.0.1 shiny.local');
    return false;
  }
}

// Create default config.json template if it doesn't exist
function createDefaultConfig() {
  const configPath = path.join(basePath, 'config.json');
  const imgPath = path.join(basePath, 'img');
  const txtPath = path.join(basePath, 'txt');
  if (fs.existsSync(configPath) && fs.existsSync(imgPath) && fs.existsSync(txtPath)) {
    return;
  }

  const defaultConfig = {
    "counterFilePath": path.join(txtPath, 'shiny.txt'),
    "pokemonImage": "img/pokemon.png",
    "failedCatchesFilePath": "txt/failed_catches.txt",
    "lastShinyImage": "img/last_shiny.png",
    "livingDexCount": "txt/living_dex.txt",
    "livingDexTotal": 0,
    "sections": {
      "currentHunt": true,
      "failedAttempts": false,
      "lastShiny": true,
      "livingDex": false
    }
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    fs.mkdirSync(imgPath);
    fs.mkdirSync(txtPath);
    console.log('✓ Created default config.json template and img/ and txt/ folders');
    console.log('  Please edit config.json to point to your files and images.');
    console.log('  Text files and images need to be in the img/ and txt/ folders next to the executable.');
  } catch (error) {
    console.error('Error creating default config.json:', error.message);
  }
}

// Load configuration
let config = {};

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

function loadConfig() {
  try {
    const configPath = path.join(basePath, 'config.json');
    const newConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = newConfig;
    console.log('✓ Config reloaded successfully');
    console.log(`  Counter file: ${config.counterFilePath || 'Not configured'}`);
    console.log(`  Pokemon image: ${config.pokemonImage || 'Not configured'}`);
    console.log(`  Sections: ${JSON.stringify(getSectionConfig())}`);
    return true;
  } catch (error) {
    console.error('Error loading config.json:', error.message);
    console.error('  Keeping previous configuration');
    return false;
  }
}

// First-run setup
console.log('Starting Pokemon Shiny Hunt Tracker...');
if (isPkg) {
  console.log('Running as standalone executable');
}

// Create default config if missing
createDefaultConfig();

// Check and add hosts file entry
(async () => {
  if (!(await checkHostsEntry())) {
    console.log('Adding hosts file entry (may require admin elevation)...');
    await addHostsEntry();
  }
})();

// Initial load
if (!loadConfig()) {
  console.error('Failed to load config.json. Please check the file and try again.');
  process.exit(1);
}

// Watch for config file changes
let reloadTimeout;
const configPath = path.join(basePath, 'config.json');
if (fs.existsSync(configPath)) {
  fs.watch(configPath, (eventType) => {
    if (eventType === 'change') {
      // Debounce: wait 100ms before reloading to handle multiple events
      clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(() => {
        console.log('\n[Config change detected] Reloading config.json...');
        loadConfig();
      }, 100);
    }
  });
}

// API endpoint to get counter value
app.get('/api/counter', (req, res) => {
  try {
    const counterPath = resolvePath(config.counterFilePath);
    
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
    const pokemonImage = resolvePath(config.pokemonImage);
    
    if (!pokemonImage) {
      return res.status(500).json({ error: 'Pokemon image path not configured' });
    }

    // Check if image file exists
    if (!fs.existsSync(pokemonImage)) {
      return res.status(404).json({ error: 'Pokemon image not found' });
    }

    // Return path relative to basePath, normalized for web (forward slashes)
    const relativePath = path.relative(basePath, pokemonImage).replace(/\\/g, '/');
    res.json({ imagePath: relativePath });
  } catch (error) {
    console.error('Error reading Pokemon image:', error.message);
    res.status(500).json({ error: 'Failed to read Pokemon image' });
  }
});

// API endpoint to get failed catches counter
app.get('/api/failed-catches', (req, res) => {
  try {
    const failedCatchesPath = resolvePath(config.failedCatchesFilePath);
    
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
    const lastShinyImage = resolvePath(config.lastShinyImage);
    
    if (!lastShinyImage || lastShinyImage === '') {
      return res.json({ imagePath: '' });
    }

    // Check if image file exists
    if (!fs.existsSync(lastShinyImage)) {
      return res.status(404).json({ error: 'Last shiny image not found' });
    }

    // Return path relative to basePath, normalized for web (forward slashes)
    const relativePath = path.relative(basePath, lastShinyImage).replace(/\\/g, '/');
    res.json({ imagePath: relativePath });
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

    const livingDexCountPath = resolvePath(config.livingDexCount);
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
