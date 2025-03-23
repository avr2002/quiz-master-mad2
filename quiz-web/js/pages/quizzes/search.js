import { searchQuizzes, formatQuizDate, formatDuration } from '/js/api/quizzes.js';
import { getChapter } from '/js/api/chapters.js';

// Initialize the quizzes search page
export function initQuizzesSearch() {
    // Check if user is authenticated and is admin
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = '/pages/hello.html';
        return;
    }

    // Get chapter ID and search query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const chapterId = urlParams.get('chapter_id');
    const searchQuery = urlParams.get('q') || '';
    const limit = urlParams.get('limit') || 10;
    const offset = urlParams.get('offset') || 0;

    if (!chapterId) {
        showError('Chapter ID is required');
        return;
    }

    // Set up search form fields
    const chapterIdInput = document.getElementById('chapter-id-input');
    const searchQueryInput = document.getElementById('search-query');
    const limitSelect = document.getElementById('search-limit');

    if (chapterIdInput) chapterIdInput.value = chapterId;
    if (searchQueryInput) searchQueryInput.value = searchQuery;
    if (limitSelect) limitSelect.value = limit;

    // Setup quizzes link
    const quizzesLink = document.getElementById('quizzes-link');
    if (quizzesLink) {
        quizzesLink.href = `/pages/admin/quizzes/list.html?chapter_id=${chapterId}`;
    }

    // Set up search form
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const formData = new FormData(this);
            const query = formData.get('q');
            const formLimit = formData.get('limit');

            window.location.href = `/pages/admin/quizzes/search.html?chapter_id=${chapterId}&q=${encodeURIComponent(query)}&limit=${formLimit}`;
        });
    }

    // Load chapter details
    loadChapterDetails(chapterId);

    // Perform search if query is provided
    if (searchQuery) {
        performSearch(chapterId, searchQuery, limit, offset);
    } else {
        // Show empty results if no search query
        document.getElementById('result-stats').textContent = 'Enter a search term above to find quizzes';
        document.getElementById('quizzesTableBody').innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No search performed yet</td>
            </tr>
        `;
    }
}

// Load chapter details
async function loadChapterDetails(chapterId) {
    try {
        const chapter = await getChapter(chapterId);

        // Update breadcrumb
        const chapterBreadcrumb = document.getElementById('chapter-breadcrumb');
        if (chapterBreadcrumb) {
            chapterBreadcrumb.innerHTML = `<a href="/pages/admin/chapters/list.html?subject_id=${chapter.subject_id}">${chapter.name}</a>`;
        }

        // Update document title
        document.title = `Search Quizzes: ${chapter.name} - Admin Dashboard`;
    } catch (error) {
        showError(`Error loading chapter details: ${error.message}`);
    }
}

// Perform search for quizzes
async function performSearch(chapterId, query, limit, offset) {
    try {
        const results = await searchQuizzes(chapterId, query, limit, offset);

        // Update result stats
        const resultStats = document.getElementById('result-stats');
        if (resultStats) {
            resultStats.textContent = `Found ${results.total} results for "${query}"`;
        }

        // Render results
        renderSearchResults(results, chapterId, query, limit);
    } catch (error) {
        showError(`Error searching quizzes: ${error.message}`);

        // Show empty results on error
        document.getElementById('quizzesTableBody').innerHTML = `
            <tr>
                <td colspan="5" class="text-center">An error occurred while searching</td>
            </tr>
        `;
    }
}

// Render search results
function renderSearchResults(results, chapterId, query, limit) {
    const tableBody = document.getElementById('quizzesTableBody');
    const paginationContainer = document.getElementById('pagination');

    if (!results.items || results.items.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No quizzes found matching your search criteria</td>
            </tr>
        `;
        paginationContainer.innerHTML = '';
        return;
    }

    // Render quizzes
    tableBody.innerHTML = results.items.map(quiz => `
        <tr>
            <td>${quiz.name}</td>
            <td>${formatQuizDate(quiz.date_of_quiz)}</td>
            <td>${formatDuration(quiz.time_duration)}</td>
            <td>${quiz.remarks || 'No remarks'}</td>
            <td>
                <button class="btn btn-sm btn-primary me-2" 
                        onclick="location.href='/pages/admin/quizzes/edit.html?chapter_id=${chapterId}&id=${quiz.id}'">
                    Edit
                </button>
                <button class="btn btn-sm btn-danger" 
                        onclick="handleDelete(${quiz.id})">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');

    // Render pagination if applicable
    renderPagination(results, chapterId, query, limit);
}

// Render pagination controls
function renderPagination(results, chapterId, query, limit) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(results.total / limit);
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    const currentPage = Math.floor(results.offset / limit) + 1;
    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="${currentPage > 1 ? buildPageUrl(chapterId, query, limit, (currentPage - 2) * limit) : '#'}" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="${buildPageUrl(chapterId, query, limit, (i - 1) * limit)}">${i}</a>
            </li>
        `;
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="${currentPage < totalPages ? buildPageUrl(chapterId, query, limit, currentPage * limit) : '#'}" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

// Build URL for pagination
function buildPageUrl(chapterId, query, limit, offset) {
    return `/pages/admin/quizzes/search.html?chapter_id=${chapterId}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
}

// Handle quiz deletion (implement later or import from list.js)
export async function handleDelete(quizId) {
    // Import and reuse the same function from list.js
    const { handleDelete: deleteHandler } = await import('./list.js');
    return deleteHandler(quizId);
}

// Make handleDelete available globally
window.handleDelete = handleDelete; 