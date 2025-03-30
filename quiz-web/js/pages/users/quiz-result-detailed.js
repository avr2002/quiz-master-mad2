import { getQuizScore, getQuizAttemptResults } from '/js/api/quiz_attempts.js';
import { formatQuizDate, formatDuration } from '/js/api/quizzes.js';
import { isAuthenticated, showError } from '/js/utils.js';

// Initialize the results page
document.addEventListener('DOMContentLoaded', initDetailedResultsPage);

/**
 * Initialize the detailed quiz results page
 */
async function initDetailedResultsPage() {
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
        redirectToMyQuizzes(3);
        return;
    }

    try {
        // Step 1: Load basic score information
        const scoreData = await getQuizScore(quizId);

        // Display the score summary
        renderScoreSummary(scoreData);

        // Step 2: Load detailed question results
        try {
            const resultsData = await getQuizAttemptResults(quizId);

            // If questions are available, render them
            if (resultsData && resultsData.questions && resultsData.questions.length > 0) {
                renderQuestions(resultsData.questions);
            } else {
                // If no questions in response
                document.getElementById('questions-container').innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i> No question details are available for this quiz.
                    </div>
                `;
            }
        } catch (error) {
            // If questions can't be fetched but score is available
            console.error('Error fetching quiz questions:', error);
            document.getElementById('questions-container').innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i> Could not load question details.
                </div>
            `;
        }
    } catch (error) {
        // Handle errors (e.g., quiz not attempted)
        showError(error.message || 'Failed to load quiz results');
        redirectToMyQuizzes(3);
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
        document.getElementById('quiz-title').textContent = `Detailed Results: ${scoreData.quiz_name}`;
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
 * Render all question results
 * @param {Array} questions - The questions with answers
 */
function renderQuestions(questions) {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';

    questions.forEach((question, index) => {
        const questionElement = createQuestionElement(question, index);
        container.appendChild(questionElement);
    });
}

/**
 * Create an element for a single question result
 * @param {Object} question - The question data with answers
 * @param {number} index - The question index
 * @returns {HTMLElement} - The question element
 */
function createQuestionElement(question, index) {
    // Create container
    const questionElement = document.createElement('div');
    questionElement.className = 'question-result';

    // Determine status text and icons for the header
    let statusText, pointsText;

    if (question.user_answer === null) {
        // Not answered
        statusText = 'Not Answered';
        pointsText = '+0 points';
    } else if (question.is_correct) {
        // Correct answer
        statusText = 'Correct';
        pointsText = `+${question.points} points`;
    } else {
        // Incorrect answer
        statusText = 'Incorrect';
        pointsText = '+0 points';
    }

    // Create question content
    questionElement.innerHTML = `
        <div class="card-header d-flex justify-content-between">
            <div>
                Question ${index + 1}
            </div>
            <div>
                ${statusText} 
                (${pointsText})
            </div>
        </div>
        <div class="card-body">
            <h5 class="question-statement mb-3">${question.question_statement}</h5>
            <div class="options-container">
                ${createOptionsHTML(question)}
            </div>
            ${question.user_answer === null ?
            '<div class="alert alert-warning mt-3">You did not answer this question.</div>' : ''}
        </div>
    `;

    return questionElement;
}

/**
 * Create HTML for the question options
 * @param {Object} question - Question data with answers
 * @returns {string} - HTML for options
 */
function createOptionsHTML(question) {
    const options = [
        { num: 1, text: question.option1 },
        { num: 2, text: question.option2 },
        { num: 3, text: question.option3 },
        { num: 4, text: question.option4 }
    ];

    return options.map(option => {
        let classes = 'option-label';
        let badges = '';

        // Add specific badges to clearly mark correct answer and user's selection
        if (option.num == question.correct_option) {
            badges += '<span class="correct-answer-badge">Correct Answer</span>';
        }

        if (question.user_answer !== null && option.num == question.user_answer) {
            badges += '<span class="user-answer-badge">Your Answer</span>';
        }

        // Only highlight the specific option selected by the user (if answered)
        if (question.user_answer !== null && option.num == question.user_answer) {
            // If user's answer is correct
            if (option.num == question.correct_option) {
                classes += ' option-correct';
            } else {
                // If user's answer is wrong
                classes += ' option-incorrect';
            }
        }

        return `
            <div class="${classes}">
                <span>${option.text}</span>
                ${badges}
            </div>
        `;
    }).join('');
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
 * Redirect back to my quizzes page after a delay
 * @param {number} seconds - Delay in seconds before redirecting
 */
function redirectToMyQuizzes(seconds = 3) {
    setTimeout(() => {
        window.location.href = '/pages/users/my-quizzes.html';
    }, seconds * 1000);
} 