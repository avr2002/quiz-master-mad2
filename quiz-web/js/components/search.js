/**
 * Search component for reuse across different pages
 */

/**
 * Creates a search bar component
 * @param {Object} options - Configuration options
 * @param {string} options.placeholder - Placeholder text for the search input
 * @param {Function} options.onSearch - Callback function when search is performed
 * @param {number} options.debounceTime - Debounce time in milliseconds (default: 300)
 * @param {string} options.containerClass - Additional class for the container
 * @returns {HTMLElement} The search component element
 */
export function createSearchBar(options) {
    const {
        placeholder = 'Search...',
        onSearch,
        debounceTime = 300,
        containerClass = ''
    } = options;

    // Create container
    const container = document.createElement('div');
    container.className = `search-container ${containerClass}`;
    container.innerHTML = `
        <div class="input-group mb-3">
            <input type="text" class="form-control search-input" 
                   placeholder="${placeholder}" aria-label="Search">
            <div class="input-group-append">
                <button class="btn btn-outline-secondary search-button" type="button">
                    <i class="fas fa-search"></i>
                </button>
            </div>
            <button class="btn btn-outline-secondary clear-button ms-2" type="button">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Get elements
    const searchInput = container.querySelector('.search-input');
    const searchButton = container.querySelector('.search-button');
    const clearButton = container.querySelector('.clear-button');

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Handle search
    const performSearch = () => {
        const query = searchInput.value.trim();
        if (onSearch) {
            onSearch(query);
        }
    };

    // Debounced search handler
    const debouncedSearch = debounce(performSearch, debounceTime);

    // Event listeners
    searchInput.addEventListener('input', debouncedSearch);
    searchButton.addEventListener('click', performSearch);

    // Clear search
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        performSearch();
    });

    // Handle Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    return container;
}

/**
 * Creates a search results container
 * @param {Object} options - Configuration options
 * @param {string} options.containerClass - Additional class for the container
 * @param {string} options.emptyMessage - Message to display when no results
 * @returns {Object} Object with the container element and methods to update it
 */
export function createSearchResults(options = {}) {
    const {
        containerClass = '',
        emptyMessage = 'No results found'
    } = options;

    // Create container
    const container = document.createElement('div');
    container.className = `search-results-container ${containerClass}`;

    return {
        container,

        /**
         * Update the search results
         * @param {Array} results - Array of result items
         * @param {Function} renderItem - Function to render each item
         */
        updateResults(results, renderItem) {
            container.innerHTML = '';

            if (!results || results.length === 0) {
                const emptyEl = document.createElement('div');
                emptyEl.className = 'text-center text-muted my-4';
                emptyEl.textContent = emptyMessage;
                container.appendChild(emptyEl);
                return;
            }

            results.forEach(item => {
                const itemEl = renderItem(item);
                container.appendChild(itemEl);
            });
        },

        /**
         * Show loading state
         */
        showLoading() {
            container.innerHTML = `
                <div class="text-center my-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
        },

        /**
         * Show error message
         * @param {string} message - Error message to display
         */
        showError(message) {
            container.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    ${message}
                </div>
            `;
        }
    };
} 