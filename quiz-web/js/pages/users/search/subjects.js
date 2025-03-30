import { searchSubjects } from '/js/api/subjects.js';
import { isAuthenticated, showError } from '/js/utils.js';

// Initialize the search results page
export function initSearchResults() {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    }

    // Get search query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';

    // Set the search input value
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = query;
    }

    // Set up search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const query = document.getElementById('searchInput').value;
            window.location.href = `/pages/users/search/subjects.html?q=${encodeURIComponent(query)}`;
        });
    }

    // Update results title
    const resultsTitle = document.getElementById('resultsTitle');
    if (resultsTitle) {
        resultsTitle.textContent = query ? `Results for "${query}"` : 'All Subjects';
    }

    // Load search results
    if (query) {
        loadSearchResults(query);
    } else {
        // If no query, show message
        const resultsTableBody = document.getElementById('resultsTableBody');
        if (resultsTableBody) {
            resultsTableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center">
                        Please enter a search term
                    </td>
                </tr>
            `;
        }
    }
}

// Load search results
async function loadSearchResults(query) {
    try {
        const resultsTableBody = document.getElementById('resultsTableBody');

        // Show loading indicator
        resultsTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `;

        // Fetch search results
        const response = await searchSubjects(query);
        const subjects = response.items || [];

        // Render results
        renderSearchResults(subjects);
    } catch (error) {
        showError(`Error searching: ${error.message}`);

        // Show error in table
        const resultsTableBody = document.getElementById('resultsTableBody');
        resultsTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-danger">
                    Error loading results. Please try again.
                </td>
            </tr>
        `;
    }
}

// Render search results
function renderSearchResults(subjects) {
    const resultsTableBody = document.getElementById('resultsTableBody');

    if (!subjects || subjects.length === 0) {
        resultsTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">
                    No subjects found matching your search
                </td>
            </tr>
        `;
        return;
    }

    resultsTableBody.innerHTML = subjects.map(subject => `
        <tr>
            <td>
                <a href="/pages/users/list/chapters.html?subject_id=${subject.id}">${subject.name}</a>
            </td>
            <td>${subject.description || 'No description'}</td>
            <td>
                <a href="/pages/users/list/chapters.html?subject_id=${subject.id}" class="btn btn-sm btn-primary">
                    View Chapters
                </a>
            </td>
        </tr>
    `).join('');
} 