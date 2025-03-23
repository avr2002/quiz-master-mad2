import { getQuiz, createQuiz, updateQuiz } from '/js/api/quizzes.js';
import { getChapter } from '/js/api/chapters.js';

// Initialize the quiz edit page
export function initQuizEdit() {
    // Check if user is authenticated and is admin
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = '/pages/hello.html';
        return;
    }

    // Get chapter ID and quiz ID (if editing) from URL
    const urlParams = new URLSearchParams(window.location.search);
    const chapterId = urlParams.get('chapter_id');
    const quizId = urlParams.get('id');
    const isEditing = !!quizId;

    if (!chapterId) {
        showError('Chapter ID is required');
        return;
    }

    // Update page titles based on whether adding or editing
    updatePageTitle(isEditing);

    // Setup chapter ID in the form
    document.getElementById('chapter-id').value = chapterId;

    // Setup cancel button
    document.getElementById('cancel-btn').addEventListener('click', () => {
        window.location.href = `/pages/admin/quizzes/list.html?chapter_id=${chapterId}`;
    });

    // Setup quizzes link in breadcrumb
    const quizzesLink = document.getElementById('quizzes-link');
    if (quizzesLink) {
        quizzesLink.href = `/pages/admin/quizzes/list.html?chapter_id=${chapterId}`;
    }

    // Load chapter details
    loadChapterDetails(chapterId);

    // Setup form submission
    const quizForm = document.getElementById('quiz-form');
    if (quizForm) {
        quizForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(quizForm);
            const quizData = {
                name: formData.get('name'),
                date_of_quiz: formData.get('date_of_quiz'),
                time_duration: formData.get('time_duration'),
                remarks: formData.get('remarks') || null
            };

            // Call appropriate function based on whether adding or editing
            if (isEditing) {
                handleUpdateQuiz(quizId, quizData, chapterId);
            } else {
                handleCreateQuiz(chapterId, quizData);
            }
        });
    }

    // If editing, load existing quiz data
    if (isEditing) {
        loadQuizData(quizId);
    } else {
        // Set default date to tomorrow at 9:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);

        const dateInput = document.getElementById('date-of-quiz');
        if (dateInput) {
            dateInput.value = tomorrow.toISOString().slice(0, 16);
        }

        // Set default duration to 1 hour
        const durationInput = document.getElementById('time-duration');
        if (durationInput) {
            durationInput.value = '01:00';
        }
    }
}

// Update page title based on whether adding or editing
function updatePageTitle(isEditing) {
    const action = isEditing ? 'Edit' : 'Add';

    // Update page title elements
    document.title = `${action} Quiz - Admin Dashboard`;

    const pageAction = document.getElementById('page-action');
    if (pageAction) {
        pageAction.textContent = action;
    }

    const headerAction = document.getElementById('header-action');
    if (headerAction) {
        headerAction.textContent = action;
    }
}

// Load chapter details
async function loadChapterDetails(chapterId) {
    try {
        const chapter = await getChapter(chapterId);

        // Update breadcrumb navigation
        const chapterBreadcrumb = document.getElementById('chapter-breadcrumb');
        if (chapterBreadcrumb) {
            chapterBreadcrumb.innerHTML = `<a href="/pages/admin/chapters/list.html?subject_id=${chapter.subject_id}">${chapter.name}</a>`;
        }
    } catch (error) {
        showError(`Error loading chapter details: ${error.message}`);
    }
}

// Load existing quiz data when editing
async function loadQuizData(quizId) {
    try {
        const quiz = await getQuiz(quizId);

        // Populate form fields with quiz data
        const nameInput = document.getElementById('quiz-name');
        const dateInput = document.getElementById('date-of-quiz');
        const durationInput = document.getElementById('time-duration');
        const remarksInput = document.getElementById('remarks');

        if (nameInput && quiz.name) {
            nameInput.value = quiz.name;
        }

        if (dateInput && quiz.date_of_quiz) {
            // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
            const date = new Date(quiz.date_of_quiz);
            dateInput.value = date.toISOString().slice(0, 16);
        }

        if (durationInput && quiz.time_duration) {
            durationInput.value = quiz.time_duration;
        }

        if (remarksInput) {
            remarksInput.value = quiz.remarks || '';
        }
    } catch (error) {
        showError(`Error loading quiz data: ${error.message}`);
    }
}

// Handle quiz creation
async function handleCreateQuiz(chapterId, quizData) {
    try {
        await createQuiz(chapterId, quizData);
        showSuccess('Quiz created successfully');

        // Redirect to quiz list
        setTimeout(() => {
            window.location.href = `/pages/admin/quizzes/list.html?chapter_id=${chapterId}`;
        }, 1000);
    } catch (error) {
        showError(`Error creating quiz: ${error.message}`);
    }
}

// Handle quiz update
async function handleUpdateQuiz(quizId, quizData, chapterId) {
    try {
        await updateQuiz(quizId, quizData);
        showSuccess('Quiz updated successfully');

        // Redirect to quiz list
        setTimeout(() => {
            window.location.href = `/pages/admin/quizzes/list.html?chapter_id=${chapterId}`;
        }, 1000);
    } catch (error) {
        showError(`Error updating quiz: ${error.message}`);
    }
} 