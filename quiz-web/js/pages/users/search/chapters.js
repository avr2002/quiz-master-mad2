import { searchChapters } from '/js/api/chapters.js';
import { getSubject } from '/js/api/subjects.js';
import { isAuthenticated, showError } from '/js/utils.js';

// Initialize the search results page
export function initChaptersSearch() {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    }

    // Get search query and subject ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';
    const subjectId = urlParams.get('subject_id');

    if (!subjectId) {
        showError('Subject ID is required');
        return;
    }

    // Set the search input value
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = query;
    }

    // Set subject ID in the form
    const subjectIdInput = document.getElementById('subject-id-input');
    if (subjectIdInput) {
        subjectIdInput.value = subjectId;
    }

    // Set up back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = `/pages/users/list/chapters.html?subject_id=${subjectId}`;
        });
    }

    // Set up chapters link in breadcrumb
    const chaptersLink = document.getElementById('chapters-link');
    if (chaptersLink) {
        chaptersLink.href = `/pages/users/list/chapters.html?subject_id=${subjectId}`;
    }

    // Set up search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const query = document.getElementById('searchInput').value;
            window.location.href = `/pages/users/search/chapters.html?subject_id=${subjectId}&q=${encodeURIComponent(query)}`;
        });
    }

    // Load subject details
    loadSubjectDetails(subjectId);

    // Update results title
    const resultsTitle = document.getElementById('resultsTitle');
    if (resultsTitle) {
        resultsTitle.textContent = query ? `Results for "${query}"` : 'All Chapters';
    }

    // Load search results
    if (query) {
        loadSearchResults(subjectId, query);
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

// Load subject details
async function loadSubjectDetails(subjectId) {
    try {
        const subject = await getSubject(subjectId);

        // Update subject name
        const subjectName = document.getElementById('subject-name');
        if (subjectName) {
            subjectName.textContent = `Subject: ${subject.name}`;
        }

        // Update document title
        document.title = `Search Chapters: ${subject.name}`;
    } catch (error) {
        showError(`Error loading subject details: ${error.message}`);
    }
}

// Load search results
async function loadSearchResults(subjectId, query) {
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
        const response = await searchChapters(subjectId, query);
        const chapters = response.items || [];

        // Render results
        renderSearchResults(chapters, subjectId);
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
function renderSearchResults(chapters, subjectId) {
    const resultsTableBody = document.getElementById('resultsTableBody');

    if (!chapters || chapters.length === 0) {
        resultsTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">
                    No chapters found matching your search
                </td>
            </tr>
        `;
        return;
    }

    resultsTableBody.innerHTML = chapters.map(chapter => `
        <tr>
            <td>
                <a href="/pages/users/list/quizzes.html?chapter_id=${chapter.id}">${chapter.name}</a>
            </td>
            <td>${chapter.description || 'No description'}</td>
            <td>
                <a href="/pages/users/list/quizzes.html?chapter_id=${chapter.id}" class="btn btn-sm btn-primary">
                    View Quizzes
                </a>
            </td>
        </tr>
    `).join('');
} 