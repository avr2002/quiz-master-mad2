import { searchSubjects, deleteSubject } from '/js/api/subjects.js';

// Initialize the search results page
export function initSearchResults() {
    // Check if user is authenticated and is admin
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = '/pages/hello.html';
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
                <a href="/pages/admin/chapters/list.html?subject_id=${subject.id}">${subject.name}</a>
            </td>
            <td>${subject.description || 'No description'}</td>
            <td>
                <button class="btn btn-sm btn-primary me-2" 
                        onclick="location.href='edit.html?id=${subject.id}'">
                    Edit
                </button>
                <button class="btn btn-sm btn-danger" 
                        onclick="handleDelete(${subject.id})">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Handle subject deletion
export async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this subject?')) {
        try {
            await deleteSubject(id);

            // Reload the current search results
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q') || '';

            if (query) {
                loadSearchResults(query);
            }

            showSuccess('Subject deleted successfully');
        } catch (error) {
            showError(`Error deleting subject: ${error.message}`);
        }
    }
}

// Make handleDelete available globally
window.handleDelete = handleDelete; 