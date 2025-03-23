import { getQuizzes, deleteQuiz, formatQuizDate, formatDuration } from '/js/api/quizzes.js';
import { getChapter } from '/js/api/chapters.js';

// Initialize the quizzes list page
export function initQuizzesList() {
    // Check if user is authenticated and is admin
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = '/pages/hello.html';
        return;
    }

    // Get chapter ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const chapterId = urlParams.get('chapter_id');

    if (!chapterId) {
        showError('Chapter ID is required');
        return;
    }

    // Set chapter ID in the search form
    const chapterIdInput = document.getElementById('chapter-id-input');
    if (chapterIdInput) {
        chapterIdInput.value = chapterId;
    }

    // Set up Add Quiz button
    const addQuizBtn = document.getElementById('add-quiz-btn');
    if (addQuizBtn) {
        addQuizBtn.addEventListener('click', () => {
            window.location.href = `/pages/admin/quizzes/edit.html?chapter_id=${chapterId}`;
        });
    }

    // Load chapter details and quizzes
    loadChapterDetails(chapterId);
    loadQuizzes(chapterId);
}

// Load chapter details
async function loadChapterDetails(chapterId) {
    try {
        const chapter = await getChapter(chapterId);

        // Update page title and description
        const chapterTitle = document.getElementById('chapter-title');
        const chapterDescription = document.getElementById('chapter-description');
        const chapterBreadcrumb = document.getElementById('chapter-breadcrumb');

        if (chapterTitle) {
            chapterTitle.textContent = `Quizzes: ${chapter.name}`;
        }

        if (chapterDescription) {
            chapterDescription.textContent = chapter.description;
        }

        if (chapterBreadcrumb) {
            chapterBreadcrumb.innerHTML = `<a href="/pages/admin/chapters/list.html?subject_id=${chapter.subject_id}">${chapter.name}</a>`;
        }

        // Update document title
        document.title = `Quizzes: ${chapter.name} - Admin Dashboard`;
    } catch (error) {
        showError(`Error loading chapter details: ${error.message}`);
    }
}

// Load quizzes for the chapter
async function loadQuizzes(chapterId) {
    try {
        const quizzes = await getQuizzes(chapterId);
        renderQuizzes(quizzes, chapterId);
    } catch (error) {
        showError(`Error loading quizzes: ${error.message}`);
    }
}

// Render quizzes in the table
function renderQuizzes(quizzes, chapterId) {
    const tableBody = document.getElementById('quizzesTableBody');

    if (!quizzes || quizzes.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <p class="my-3">No quizzes found for this chapter.</p>
                    <button class="btn btn-primary" onclick="location.href='/pages/admin/quizzes/edit.html?chapter_id=${chapterId}'">
                        Add your first quiz
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = quizzes.map(quiz => `
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
}

// Handle quiz deletion
export async function handleDelete(quizId) {
    if (confirm('Are you sure you want to delete this quiz? This will also delete all questions and scores associated with this quiz.')) {
        try {
            await deleteQuiz(quizId);
            showSuccess('Quiz deleted successfully');

            // Get the chapter ID from the URL to reload quizzes
            const urlParams = new URLSearchParams(window.location.search);
            const chapterId = urlParams.get('chapter_id');
            loadQuizzes(chapterId);
        } catch (error) {
            showError(`Error deleting quiz: ${error.message}`);
        }
    }
}

// Make handleDelete available globally
window.handleDelete = handleDelete; 