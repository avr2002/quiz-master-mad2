import { getUserQuizzes } from '/js/api/quiz_registration.js';
import { startQuizAttempt } from '/js/api/quiz_attempts.js';
import { formatQuizDate, formatDuration } from '/js/api/quizzes.js';
import { isAuthenticated } from '/js/utils.js';

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initMyQuizzesPage);

/**
 * Initialize the My Quizzes page
 */
async function initMyQuizzesPage() {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    }

    // Add event delegation for quiz buttons
    document.addEventListener('click', function (event) {
        if (event.target.closest('.take-quiz-btn')) {
            const button = event.target.closest('.take-quiz-btn');
            const quizId = button.dataset.quizId;
            takeQuiz(quizId);
            event.preventDefault();
        }
    });

    try {
        // Load quizzes that the user has signed up for
        const quizzes = await getUserQuizzes();

        // Show no quizzes container if no quizzes found
        // If the response is 404, show a message
        if (!quizzes || quizzes.length === 0) {
            showNoQuizzesMessage();
            return;
        }

        // Categorize quizzes by status
        const categorizedQuizzes = categorizeQuizzes(quizzes);

        // Render each category of quizzes
        renderQuizzesByCategory(categorizedQuizzes);

    } catch (error) {
        showError(error.message || 'Failed to load your quizzes');
    }
}

/**
 * Categorize quizzes by their status
 * @param {Array} quizzes - The quizzes to categorize
 * @returns {Object} - The categorized quizzes
 */
function categorizeQuizzes(quizzes) {
    const active = [];
    const upcoming = [];
    const completed = [];

    quizzes.forEach(quiz => {
        if (quiz.status === 'active') {
            active.push(quiz);
        } else if (quiz.status === 'upcoming') {
            upcoming.push(quiz);
        } else {
            completed.push(quiz);
        }
    });

    return { active, upcoming, completed };
}

/**
 * Render quizzes by their categories
 * @param {Object} categorizedQuizzes - The categorized quizzes
 */
function renderQuizzesByCategory(categorizedQuizzes) {
    // Hide loading container and show quiz content
    document.getElementById('loading-container').classList.add('d-none');
    document.getElementById('quiz-content').classList.remove('d-none');

    // Render each category
    renderQuizCards('active-quizzes-container', categorizedQuizzes.active, 'active');
    renderQuizCards('upcoming-quizzes-container', categorizedQuizzes.upcoming, 'upcoming');
    renderQuizCards('completed-quizzes-container', categorizedQuizzes.completed, 'completed');
}

/**
 * Render quiz cards for a specific category
 * @param {string} containerId - The ID of the container to render in
 * @param {Array} quizzes - The quizzes to render
 * @param {string} category - The category of quizzes ('active', 'upcoming', or 'completed')
 */
function renderQuizCards(containerId, quizzes, category) {
    const container = document.getElementById(containerId);

    // Clear loading message
    container.innerHTML = '';

    // If no quizzes in this category, show message
    if (quizzes.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <p class="text-muted">No ${category} quizzes found.</p>
            </div>
        `;
        return;
    }

    // Create a card for each quiz
    quizzes.forEach(quiz => {
        const card = createQuizCard(quiz, category);
        container.appendChild(card);
    });
}

/**
 * Create a card element for a quiz
 * @param {Object} quiz - The quiz data
 * @param {string} category - The category of the quiz
 * @returns {HTMLElement} - The quiz card element
 */
function createQuizCard(quiz, category) {
    // Create column and card
    const column = document.createElement('div');
    column.className = 'col-md-6 col-lg-4';

    // Get score class
    let scoreClass = '';
    let scoreDisplay = '';

    if (category === 'completed') {
        const scorePercentage = (quiz.user_score / quiz.total_quiz_score) * 100;

        if (scorePercentage >= 70) {
            scoreClass = 'good';
        } else if (scorePercentage >= 50) {
            scoreClass = 'average';
        } else {
            scoreClass = 'poor';
        }

        scoreDisplay = `
            <div class="mt-2">
                <span class="quiz-score ${scoreClass}">
                    ${quiz.user_score}/${quiz.total_quiz_score} points
                </span>
                <span class="ms-2 text-muted">
                    (${quiz.number_of_correct_answers}/${quiz.total_questions} correct)
                </span>
            </div>
        `;
    }

    // Create action button based on category
    let actionButton = '';

    if (category === 'active') {
        actionButton = `
            <button class="btn btn-success btn-sm mt-2 take-quiz-btn" data-quiz-id="${quiz.id}">
                <i class="fas fa-play-circle me-1"></i> Take Quiz
            </button>
        `;
    } else if (category === 'upcoming') {
        // Calculate days until quiz
        const quizDate = new Date(quiz.date_of_quiz);
        const daysUntil = Math.ceil((quizDate - new Date()) / (1000 * 60 * 60 * 24));

        actionButton = `
            <div class="mt-2 text-muted">
                <i class="fas fa-clock me-1"></i>
                Starts in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}
            </div>
        `;
    } else if (category === 'completed') {
        actionButton = `
            <a href="/pages/users/quiz-result-detailed.html?quiz_id=${quiz.id}" class="btn btn-outline-primary btn-sm mt-2">
                <i class="fas fa-chart-bar me-1"></i> View Results
            </a>
        `;
    }

    // Set card content
    column.innerHTML = `
        <div class="card quiz-card h-100">
            <div class="card-body">
                <h5 class="card-title">${quiz.name}</h5>
                <div class="quiz-date mb-2">
                    <i class="far fa-calendar-alt me-1"></i> ${formatQuizDate(quiz.date_of_quiz)}
                </div>
                <div class="quiz-details">
                    <div><strong>Subject:</strong> ${quiz.subject_name}</div>
                    <div><strong>Chapter:</strong> ${quiz.chapter_name}</div>
                    <div><strong>Duration:</strong> ${formatDuration(quiz.time_duration)}</div>
                    <div><strong>Questions:</strong> ${quiz.total_questions}</div>
                    <div><strong>Points:</strong> ${quiz.total_quiz_score}</div>
                </div>
                ${scoreDisplay}
            </div>
            <div class="card-footer bg-transparent">
                ${actionButton}
            </div>
        </div>
    `;

    return column;
}

/**
 * Show message when no quizzes are found
 */
function showNoQuizzesMessage() {
    document.getElementById('loading-container').classList.add('d-none');
    document.getElementById('no-quizzes-container').classList.remove('d-none');
}

/**
 * Take a quiz - verify it's active and redirect to the quiz page
 * @param {number} quizId - The quiz ID
 */
async function takeQuiz(quizId) {
    try {
        // Show loading state
        showLoadingMessage('Preparing your quiz...');

        // Verify the quiz is active and get questions
        await startQuizAttempt(quizId);

        // Redirect to the quiz page
        window.location.href = `/pages/users/take-quiz.html?quiz_id=${quizId}`;
    } catch (error) {
        showError(error.message || 'Failed to start the quiz');
    }
}

/**
 * Show a loading message
 * @param {string} message - The message to display
 */
function showLoadingMessage(message) {
    // Find or create the alert container
    let alertContainer = document.querySelector('.alert-container');
    if (!alertContainer) {
        console.warn('Alert container not found, creating one');
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container';
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(alertContainer, container.firstChild);
        } else {
            document.body.insertBefore(alertContainer, document.body.firstChild);
        }
    }

    alertContainer.innerHTML = `
        <div class="alert alert-info alert-dismissible fade show" role="alert">
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                <div>${message}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

/**
 * Show an error message
 * @param {string} message - The error message
 */
function showError(message) {
    // Find or create the alert container
    let alertContainer = document.querySelector('.alert-container');
    if (!alertContainer) {
        console.warn('Alert container not found, creating one');
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container';
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(alertContainer, container.firstChild);
        } else {
            document.body.insertBefore(alertContainer, document.body.firstChild);
        }
    }

    alertContainer.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-circle me-2"></i> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    // Hide loading container
    document.getElementById('loading-container').classList.add('d-none');
} 