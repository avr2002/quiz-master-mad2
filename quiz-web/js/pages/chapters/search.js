import { searchChapters, deleteChapter } from '/js/api/chapters.js';
import { getSubject } from '/js/api/subjects.js';

// Initialize the search results page
export function initChaptersSearch() {
    // Check if user is authenticated and is admin
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = '/pages/hello.html';
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
            window.location.href = `/pages/admin/chapters/list.html?subject_id=${subjectId}`;
        });
    }

    // Set up chapters link in breadcrumb
    const chaptersLink = document.getElementById('chapters-link');
    if (chaptersLink) {
        chaptersLink.href = `/pages/admin/chapters/list.html?subject_id=${subjectId}`;
    }

    // Set up Add Chapter button
    const addChapterBtn = document.getElementById('add-chapter-btn');
    if (addChapterBtn) {
        addChapterBtn.addEventListener('click', () => {
            window.location.href = `/pages/admin/chapters/edit.html?subject_id=${subjectId}`;
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
        document.title = `Search Chapters: ${subject.name} - Admin Dashboard`;
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
                <a href="/pages/admin/quizzes/list.html?chapter_id=${chapter.id}">${chapter.name}</a>
            </td>
            <td>${chapter.description || 'No description'}</td>
            <td>
                <button class="btn btn-sm btn-primary me-2" 
                        onclick="location.href='/pages/admin/chapters/edit.html?subject_id=${subjectId}&id=${chapter.id}'">
                    Edit
                </button>
                <button class="btn btn-sm btn-danger" 
                        onclick="handleDelete(${subjectId}, ${chapter.id})">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Handle chapter deletion
export async function handleDelete(subjectId, chapterId) {
    if (confirm('Are you sure you want to delete this chapter? This will also delete all quizzes associated with this chapter.')) {
        try {
            await deleteChapter(subjectId, chapterId);

            // Reload the current search results
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('q') || '';

            if (query) {
                loadSearchResults(subjectId, query);
            }

            showSuccess('Chapter deleted successfully');
        } catch (error) {
            showError(`Error deleting chapter: ${error.message}`);
        }
    }
}

// Make handleDelete available globally
window.handleDelete = handleDelete; 