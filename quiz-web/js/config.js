// Configuration settings
const config = {
    // Default to localhost if no API_URL is set
    API_URL: window.API_URL || 'http://localhost:8000',
};

// Prevent modifications to config object
Object.freeze(config); 