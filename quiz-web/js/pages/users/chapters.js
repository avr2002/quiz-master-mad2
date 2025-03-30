import { getChapters, searchChapters } from '/js/api/chapters.js';
import { getSubject } from '/js/api/subjects.js';
import { isAuthenticated, showError, showSuccess } from '/js/utils.js';

// Store the current subject ID
let currentSubjectId;

// Initialize the chapters list page
export function initChaptersList() {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') !== 'user') {
        // Redirect admins to their subjects page
        window.location.href = '/pages/admin/subjects/list.html';
        return;
    }

    // Get subject ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentSubjectId = urlParams.get('subject_id');

    if (!currentSubjectId) {
        window.location.href = '/pages/users/list/subjects.html';
        return;
    }

    // Set up the search form
    document.getElementById('searchForm').addEventListener('submit', handleSearch);
    document.getElementById('clearSearch').addEventListener('click', handleClearSearch);

    // Load subject name and chapters
    loadSubjectInfo();
    loadChapters();
}

async function loadSubjectInfo() {
    try {
        const subject = await getSubject(currentSubjectId);
        document.getElementById('subjectName').textContent = `- ${subject.name}`;
        document.title = `Chapters - ${subject.name}`;
    } catch (error) {
        showError(error.message);
    }
}

async function loadChapters() {
    try {
        const chapters = await getChapters(currentSubjectId);
        renderChapters(chapters);
    } catch (error) {
        showError(error.message);
    }
}

function handleSearch(event) {
    event.preventDefault();

    const query = document.getElementById('searchQuery').value.trim();

    if (!query) {
        loadChapters();
        return;
    }

    // Redirect to the search page
    window.location.href = `/pages/users/search/chapters.html?subject_id=${currentSubjectId}&q=${encodeURIComponent(query)}`;
}

function handleClearSearch(event) {
    event.preventDefault();
    document.getElementById('searchQuery').value = '';
    loadChapters();
}

function renderChapters(chapters) {
    const tableBody = document.getElementById('chaptersTableBody');
    const noResults = document.getElementById('noResults');

    if (!chapters || chapters.length === 0) {
        tableBody.innerHTML = '';
        noResults.classList.remove('d-none');
        return;
    }

    noResults.classList.add('d-none');

    tableBody.innerHTML = chapters.map(chapter => `
        <tr>
            <td>
                <a href="/pages/users/list/quizzes.html?chapter_id=${chapter.id}">${chapter.name}</a>
            </td>
            <td>${chapter.description || ''}</td>
        </tr>
    `).join('');
} 