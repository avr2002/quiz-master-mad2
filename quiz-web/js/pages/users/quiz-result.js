import { getQuizScore } from '/js/api/quiz_attempts.js';

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
        const quizDate = new Date(scoreData.date_of_quiz);
        const formattedDate = quizDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('quiz-date').innerHTML = `<strong>Date:</strong> ${formattedDate}`;
    }

    // Display duration if available
    if (scoreData.time_duration) {
        document.getElementById('quiz-duration').innerHTML =
            `<strong>Duration:</strong> ${scoreData.time_duration} minutes`;
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

    // Determine status based on user's answer and correctness
    let statusClass, statusText, statusIcon, pointsText;

    if (question.user_answer === null) {
        // Not answered
        statusClass = 'incorrect-answer';
        statusText = 'Not Answered';
        statusIcon = '<i class="fas fa-minus-circle text-warning me-2"></i>';
        pointsText = '+0 points';
    } else if (question.is_correct) {
        // Correct answer
        statusClass = 'correct-answer';
        statusText = 'Correct';
        statusIcon = '<i class="fas fa-check-circle text-success me-2"></i>';
        pointsText = `+${question.points} points`;
    } else {
        // Incorrect answer
        statusClass = 'incorrect-answer';
        statusText = 'Incorrect';
        statusIcon = '<i class="fas fa-times-circle text-danger me-2"></i>';
        pointsText = '+0 points';
    }

    questionElement.className = `question-result ${statusClass}`;

    // Create question content
    questionElement.innerHTML = `
        <div class="card-header d-flex justify-content-between">
            <div>
                ${statusIcon} Question ${index + 1}
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

        // Mark correct answer
        if (option.num == question.correct_answer) {
            classes += ' option-correct';
        }

        // Mark user's incorrect answer if they provided one
        if (question.user_answer !== null &&
            option.num == question.user_answer &&
            option.num != question.correct_answer) {
            classes += ' option-incorrect';
        }

        // Fade options that weren't selected or correct
        if ((question.user_answer === null || option.num != question.user_answer) &&
            option.num != question.correct_answer) {
            classes += ' option-not-selected';
        }

        // Add checkmark/cross indicators
        let indicator = '';
        if (option.num == question.correct_answer) {
            indicator = '<i class="fas fa-check float-end text-success"></i>';
        } else if (question.user_answer !== null && option.num == question.user_answer) {
            indicator = '<i class="fas fa-times float-end text-danger"></i>';
        }

        return `
            <div class="${classes}">
                ${option.text}
                ${indicator}
            </div>
        `;
    }).join('');
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