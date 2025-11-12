// Pokemon Shiny Hunt Tracker JavaScript

let counterValue = 0;
let failedCatchesValue = 0;
let pokemonImagePath = '';
let lastShinyImagePath = '';
let livingDexCountValue = 0;
let livingDexTotalValue = 0;
let sectionConfig = {
    currentHunt: true,
    failedAttempts: false,
    lastShiny: true,
    livingDex: false,
};
const pollingIntervals = [];

function clearPollingIntervals() {
    while (pollingIntervals.length) {
        clearInterval(pollingIntervals.pop());
    }
}

function toggleSection(sectionId, isEnabled) {
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
        sectionElement.style.display = isEnabled ? '' : 'none';
    }
}

function applySectionConfig() {
    toggleSection('current-hunt-section', sectionConfig.currentHunt);
    toggleSection('failed-attempts-section', sectionConfig.failedAttempts);
    toggleSection('last-shiny-section', sectionConfig.lastShiny);
    toggleSection('living-dex-section', sectionConfig.livingDex);

    if (sectionConfig.livingDex) {
        updateLivingDexDisplay();
    }
}

async function fetchSectionConfig() {
    try {
        const response = await fetch('/api/config/sections');
        if (response.ok) {
            const data = await response.json();
            if (data && data.sections) {
                sectionConfig = { ...sectionConfig, ...data.sections };
                applySectionConfig();
            }
        } else {
            console.error('Failed to fetch section config:', response.statusText);
            applySectionConfig();
        }
    } catch (error) {
        console.error('Error fetching section config:', error);
        applySectionConfig();
    }
}

// Function to fetch counter value from server
async function fetchCounter() {
    if (!sectionConfig.currentHunt) {
        return;
    }
    try {
        const response = await fetch('/api/counter');
        if (response.ok) {
            const data = await response.json();
            const newCount = parseInt(data.count) || 0;
            if (newCount !== counterValue) {
                counterValue = newCount;
                updateCounterDisplay();
            }
        } else {
            console.error('Failed to fetch counter:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching counter:', error);
    }
}

// Function to fetch failed catches counter from server
async function fetchFailedCatches() {
    if (!sectionConfig.failedAttempts) {
        return;
    }
    try {
        const response = await fetch('/api/failed-catches');
        if (response.ok) {
            const data = await response.json();
            const newCount = parseInt(data.count) || 0;
            if (newCount !== failedCatchesValue) {
                failedCatchesValue = newCount;
                updateFailedCatchesDisplay();
            }
        } else {
            console.error('Failed to fetch failed catches:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching failed catches:', error);
    }
}

// Function to fetch Pokemon image info from server
async function fetchPokemonInfo() {
    if (!sectionConfig.currentHunt) {
        return;
    }
    try {
        const response = await fetch('/api/pokemon');
        if (response.ok) {
            const data = await response.json();
            if (data.imagePath !== pokemonImagePath) {
                pokemonImagePath = data.imagePath;
                updatePokemonImage();
            }
        } else {
            console.error('Failed to fetch Pokemon info:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching Pokemon info:', error);
    }
}

// Function to fetch last shiny Pokemon image info from server
async function fetchLastShinyInfo() {
    if (!sectionConfig.lastShiny) {
        return;
    }
    try {
        const response = await fetch('/api/last-shiny');
        if (response.ok) {
            const data = await response.json();
            if (data.imagePath !== lastShinyImagePath) {
                lastShinyImagePath = data.imagePath;
                updateLastShinyImage();
            }
        } else {
            console.error('Failed to fetch last shiny info:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching last shiny info:', error);
    }
}

// Function to fetch living dex info from server
async function fetchLivingDexInfo() {
    if (!sectionConfig.livingDex) {
        return;
    }
    try {
        const response = await fetch('/api/living-dex');
        if (response.ok) {
            const data = await response.json();
            const newCount = Number(data.count);
            const newTotal = Number(data.total);

            const normalizedCount = Number.isFinite(newCount) && newCount >= 0 ? newCount : 0;
            const normalizedTotal = Number.isFinite(newTotal) && newTotal >= 0 ? newTotal : 0;

            if (
                normalizedCount !== livingDexCountValue ||
                normalizedTotal !== livingDexTotalValue
            ) {
                livingDexCountValue = normalizedCount;
                livingDexTotalValue = normalizedTotal;
                updateLivingDexDisplay();
            }
        } else {
            console.error('Failed to fetch living dex info:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching living dex info:', error);
    }
}

// Function to update counter display
function updateCounterDisplay() {
    const counterElement = document.getElementById('counter-value');
    if (counterElement) {
        counterElement.textContent = counterValue.toLocaleString();
    }
}

// Function to update failed catches display
function updateFailedCatchesDisplay() {
    const failedCatchesElement = document.getElementById('failed-catches-value');
    if (failedCatchesElement) {
        failedCatchesElement.textContent = failedCatchesValue.toLocaleString();
    }
}

// Function to update Pokemon image
function updatePokemonImage() {
    if (!sectionConfig.currentHunt) {
        return;
    }
    const imageElement = document.getElementById('pokemon-image');
    if (imageElement && pokemonImagePath) {
        imageElement.src = pokemonImagePath;
        imageElement.style.display = 'block';
    } else if (imageElement) {
        imageElement.style.display = 'none';
    }
}

// Function to update last shiny Pokemon image
function updateLastShinyImage() {
    if (!sectionConfig.lastShiny) {
        return;
    }
    const imageElement = document.getElementById('last-shiny-image');
    
    if (imageElement && lastShinyImagePath && lastShinyImagePath !== '') {
        imageElement.src = lastShinyImagePath;
        imageElement.style.visibility = 'visible';
    } else {
        if (imageElement) {
            imageElement.removeAttribute('src');
            imageElement.style.visibility = 'hidden';
        }
    }
}

// Function to update living dex display
function updateLivingDexDisplay() {
    if (!sectionConfig.livingDex) {
        return;
    }
    const countElement = document.getElementById('living-dex-count');
    const totalElement = document.getElementById('living-dex-total');

    if (countElement) {
        countElement.textContent = livingDexCountValue.toLocaleString();
    }

    if (totalElement) {
        totalElement.textContent = livingDexTotalValue.toLocaleString();
    }
}


// Initialize the tracker
async function initializeTracker() {
    console.log('Pokemon Shiny Hunt Tracker initialized');

    await fetchSectionConfig();

    clearPollingIntervals();

    const initialFetches = [];

    if (sectionConfig.currentHunt) {
        initialFetches.push(fetchPokemonInfo());
        initialFetches.push(fetchCounter());
    }

    if (sectionConfig.failedAttempts) {
        initialFetches.push(fetchFailedCatches());
    }

    if (sectionConfig.lastShiny) {
        initialFetches.push(fetchLastShinyInfo());
    }

    if (sectionConfig.livingDex) {
        initialFetches.push(fetchLivingDexInfo());
    }

    await Promise.all(initialFetches);

    if (sectionConfig.currentHunt) {
        pollingIntervals.push(setInterval(fetchCounter, 1000)); // Update counter every second
        pollingIntervals.push(setInterval(fetchPokemonInfo, 5000)); // Check for Pokemon changes every 5 seconds
    }

    if (sectionConfig.failedAttempts) {
        pollingIntervals.push(setInterval(fetchFailedCatches, 1000)); // Update failed catches every second
    }

    if (sectionConfig.lastShiny) {
        pollingIntervals.push(setInterval(fetchLastShinyInfo, 5000)); // Check for last shiny changes every 5 seconds
    }

    if (sectionConfig.livingDex) {
        pollingIntervals.push(setInterval(fetchLivingDexInfo, 5000)); // Update living dex progress every 5 seconds
    }
}

// Start the tracker when page loads
document.addEventListener('DOMContentLoaded', initializeTracker);
