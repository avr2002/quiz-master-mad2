import { getQuizzes, searchQuizzes, formatQuizDate, formatDuration, getQuiz } from '/js/api/quizzes.js';
import { getChapter } from '/js/api/chapters.js';
import { isAuthenticated, showError, showSuccess } from '/js/utils.js';
import { signupForQuiz, getUserQuizzes } from '/js/api/quiz_registration.js';

// Store the current chapter ID
let currentChapterId;
let subjectId;

// Initialize the quizzes list page
export function initQuizzesList() {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') !== 'user') {
        // Redirect admins to their view
        window.location.href = '/pages/admin/subjects/list.html';
        return;
    }

    // Get chapter ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentChapterId = urlParams.get('chapter_id');

    if (!currentChapterId) {
        window.location.href = '/pages/users/list/subjects.html';
        return;
    }

    // Set up the search form
    document.getElementById('searchForm').addEventListener('submit', handleSearch);
    document.getElementById('clearSearch').addEventListener('click', handleClearSearch);

    // Load chapter info and quizzes
    loadChapterInfo();
    loadQuizzes();
}

async function loadChapterInfo() {
    try {
        const chapter = await getChapter(currentChapterId);
        document.getElementById('chapterName').textContent = `- ${chapter.name}`;
        document.title = `Quizzes - ${chapter.name}`;

        // Store the subject ID
        subjectId = chapter.subject_id;

        // Update chapters link in breadcrumb
        const chaptersLink = document.getElementById('chaptersLink');
        chaptersLink.href = `/pages/users/list/chapters.html?subject_id=${subjectId}`;

    } catch (error) {
        showError(error.message);
    }
}

async function loadQuizzes() {
    try {
        const quizzes = await getQuizzes(currentChapterId);

        // Get user's signed up quizzes to check status
        const userSignups = await getUserQuizzes();
        const signedUpQuizIds = userSignups.map(signup => signup.quiz_id);

        renderQuizzes(quizzes, signedUpQuizIds);
    } catch (error) {
        showError(error.message);
    }
}

async function handleSearch(event) {
    event.preventDefault();

    const query = document.getElementById('searchQuery').value.trim();

    if (!query) {
        await loadQuizzes();
        return;
    }

    try {
        const result = await searchQuizzes(currentChapterId, query);

        // Get user's signed up quizzes to check status
        const userSignups = await getUserQuizzes();
        const signedUpQuizIds = userSignups.map(signup => signup.quiz_id);

        renderQuizzes(result.items, signedUpQuizIds);
    } catch (error) {
        showError(error.message);
    }
}

function handleClearSearch(event) {
    event.preventDefault();
    document.getElementById('searchQuery').value = '';
    loadQuizzes();
}

function renderQuizzes(quizzes, signedUpQuizIds = []) {
    const tableBody = document.getElementById('quizzesTableBody');
    const noResults = document.getElementById('noResults');

    if (!quizzes || quizzes.length === 0) {
        tableBody.innerHTML = '';
        noResults.classList.remove('d-none');
        return;
    }

    noResults.classList.add('d-none');

    tableBody.innerHTML = quizzes.map(quiz => {
        // Format the date and duration for display
        const formattedDate = formatQuizDate(quiz.date_of_quiz);
        const formattedDuration = formatDuration(quiz.time_duration);

        // Check if user is already signed up
        const isSignedUp = signedUpQuizIds.includes(quiz.id);

        // Check if quiz is in the past or active
        const quizDate = new Date(quiz.date_of_quiz);
        const now = new Date();
        const isPastOrActive = quizDate <= now;

        // Create appropriate button based on signup status and quiz date
        let signupButton;

        if (isSignedUp) {
            signupButton = `<button class="btn btn-sm btn-secondary" disabled>
                <i class="bi bi-check-circle"></i> Signed Up
            </button>`;
        } else if (isPastOrActive) {
            signupButton = `<button class="btn btn-sm btn-secondary" disabled>
                <i class="bi bi-clock-history"></i> Registration Closed
            </button>`;
        } else {
            signupButton = `<button class="btn btn-sm btn-success" onclick="handleSignUp(${quiz.id})">
                <i class="bi bi-person-plus"></i> Sign Up
            </button>`;
        }

        return `
            <tr>
                <td>${quiz.name}</td>
                <td>${formattedDate}</td>
                <td>${formattedDuration}</td>
                <td>${quiz.remarks || '-'}</td>
                <td>
                    ${signupButton}
                </td>
            </tr>
        `;
    }).join('');
}

// Handle quiz sign up
export async function handleSignUp(quizId) {
    try {
        // Get the latest quiz details
        const quiz = await getQuiz(quizId);

        // Check if quiz is in the past or active (registration closed)
        const quizDate = new Date(quiz.date_of_quiz);
        const now = new Date();

        if (quizDate <= now) {
            showError('Registration for this quiz is closed as it has already started or is in the past.');
            return;
        }

        // Try to sign up
        await signupForQuiz(quizId);

        // Show success message
        showSuccess('Successfully signed up for the quiz!');

        // Reload quizzes to update UI
        await loadQuizzes();
    } catch (error) {
        // Show error message
        showError(error.message || 'Failed to sign up for quiz');
    }
}

// Make handleSignUp available globally
window.handleSignUp = handleSignUp; 