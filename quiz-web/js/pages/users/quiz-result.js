import { getQuizScore } from '/js/api/quiz_attempts.js';
import { formatQuizDate, formatDuration } from '/js/api/quizzes.js';
import { isAuthenticated } from '/js/utils.js';

// Initialize the results page
document.addEventListener('DOMContentLoaded', initResultsPage);

/**
 * Initialize the quiz results page
 */
async function initResultsPage() {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    }

    // Get quiz ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz_id');

    if (!quizId) {
        showError('No quiz ID provided');
        redirectToQuizzes(3);
        return;
    }

    try {
        // Load basic score information
        const scoreData = await getQuizScore(quizId);

        // Display the score summary
        renderScoreSummary(scoreData);
    } catch (error) {
        // Handle errors (e.g., quiz not attempted)
        showError(error.message || 'Failed to load quiz results');
        redirectToQuizzes(3);
    }
}

/**
 * Render score summary from score data
 * @param {Object} scoreData - Basic score data from getQuizScore
 */
function renderScoreSummary(scoreData) {
    // Hide loading container and show results
    document.getElementById('loading-container').classList.add('d-none');
    document.getElementById('results-container').classList.remove('d-none');

    // Update score information
    document.getElementById('user-score').textContent = scoreData.user_score;
    document.getElementById('total-score').textContent = scoreData.total_quiz_score;

    // Calculate and display percentage
    const scorePercentage = (scoreData.user_score / scoreData.total_quiz_score) * 100;
    document.getElementById('score-percentage').textContent =
        `${scorePercentage.toFixed(1)}% score`;

    // Show correct answers count
    document.getElementById('correct-answers').textContent =
        `${scoreData.number_of_correct_answers} out of ${scoreData.total_questions} questions correct`;

    // Update quiz title if name available
    if (scoreData.quiz_name) {
        document.getElementById('quiz-title').textContent = `Results: ${scoreData.quiz_name}`;
    }

    // Format date if available
    if (scoreData.date_of_quiz) {
        document.getElementById('quiz-date').innerHTML = `<strong>Date:</strong> ${formatQuizDate(scoreData.date_of_quiz)}`;
    }

    // Display duration if available
    if (scoreData.time_duration) {
        document.getElementById('quiz-duration').innerHTML =
            `<strong>Duration:</strong> ${formatDuration(scoreData.time_duration)}`;
    }
}

/**
 * Show an error message in the alert container
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

/**
 * Redirect back to quizzes page after a delay
 * @param {number} seconds - Delay in seconds before redirecting
 */
function redirectToQuizzes(seconds = 3) {
    setTimeout(() => {
        window.location.href = '/pages/users/quizzes.html';
    }, seconds * 1000);
} 