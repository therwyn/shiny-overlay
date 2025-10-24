// Pokemon Shiny Hunt Tracker JavaScript

let counterValue = 0;
let failedCatchesValue = 0;
let pokemonImagePath = '';
let lastShinyImagePath = '';

// Function to fetch counter value from server
async function fetchCounter() {
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


// Initialize the tracker
async function initializeTracker() {
    console.log('Pokemon Shiny Hunt Tracker initialized');
    
    // Fetch initial data
    await fetchPokemonInfo();
    await fetchLastShinyInfo();
    await fetchCounter();
    await fetchFailedCatches();
    
    // Set up polling for updates
    setInterval(fetchCounter, 1000); // Update counter every second
    setInterval(fetchFailedCatches, 1000); // Update failed catches every second
    setInterval(fetchPokemonInfo, 5000); // Check for Pokemon changes every 5 seconds
    setInterval(fetchLastShinyInfo, 5000); // Check for last shiny changes every 5 seconds
}

// Start the tracker when page loads
document.addEventListener('DOMContentLoaded', initializeTracker);
