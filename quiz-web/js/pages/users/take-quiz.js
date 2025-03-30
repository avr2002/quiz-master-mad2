import { startQuizAttempt, submitQuizAnswers } from '/js/api/quiz_attempts.js';
import { isAuthenticated, showError, showSuccess } from '/js/utils.js';
import QuizTimer from '/js/timer.js';

// Quiz state
let quiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let quizTimer = null;
let timerWarningTriggered = false;

// Initialize the quiz
document.addEventListener('DOMContentLoaded', initQuiz);

/**
 * Initialize the quiz page
 */
async function initQuiz() {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') === 'admin') {
        window.location.href = '/pages/admin/quizzes.html';
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
        // Load quiz data (now includes end_time and date_of_quiz)
        quiz = await startQuizAttempt(quizId);

        // Initialize quiz UI
        initQuizUI(quiz);

        // Initialize timer based on quiz end time
        initTimer();

        // Setup quiz event listeners
        setupEventListeners();

    } catch (error) {
        // Handle errors (e.g., not signed up, quiz not active)
        showError(error.message || 'Failed to load quiz');
        redirectToQuizzes(3);
    }
}

/**
 * Initialize the quiz UI with quiz data
 * @param {Object} quizData - Quiz data from API
 */
function initQuizUI(quizData) {
    // Update quiz title and info
    document.getElementById('quiz-title').textContent = quizData.name;
    document.getElementById('quiz-info').textContent = `Total Questions: ${quizData.total_questions}`;

    // Setup progress tracking
    document.getElementById('question-progress').textContent = `Question 1 of ${quizData.total_questions}`;
    document.getElementById('progress-bar').style.width = `${(1 / quizData.total_questions) * 100}%`;
    document.getElementById('progress-bar').setAttribute('aria-valuenow', (1 / quizData.total_questions) * 100);

    // Initialize user answers array with null values (no answer selected)
    userAnswers = Array(quizData.questions.length).fill(null);

    // Show the first question
    showQuestion(0);

    // Show navigation controls
    document.getElementById('quiz-navigation').classList.remove('d-none');

    // Show submit button if only one question
    if (quizData.questions.length === 1) {
        document.getElementById('submit-quiz-btn').classList.remove('d-none');
    }
}

/**
 * Initialize the quiz timer based on quiz end time
 */
function initTimer() {
    if (!quiz || !quiz.end_time) {
        console.error('Quiz end time not available');
        return;
    }

    // Get the quiz end time from the quiz data
    const endTimeStr = quiz.end_time;
    const endTime = new Date(endTimeStr);
    const currentTime = new Date();

    // Calculate remaining time in seconds
    let remainingTimeInSeconds = Math.max(0, Math.floor((endTime - currentTime) / 1000));

    // If no time remaining, show a message and auto-submit
    if (remainingTimeInSeconds <= 0) {
        document.getElementById('timer').textContent = '00:00';
        document.getElementById('timer').classList.add('warning');
        showWarning('Time Expired!');

        // Auto-submit after 3 seconds
        setTimeout(() => {
            submitQuiz(true);
        }, 3000);

        return;
    }

    // Create the timer
    quizTimer = new QuizTimer({
        duration: remainingTimeInSeconds,
        displayElement: 'timer',
        onTick: (remainingTime) => {
            // Add warning class when less than 10% of time remains
            if (!timerWarningTriggered && remainingTime <= (remainingTimeInSeconds * 0.1)) {
                document.getElementById('timer').classList.add('warning');
                timerWarningTriggered = true;
                showWarning('Less than 10% of time remaining!');
            }
        },
        onComplete: () => {
            // Auto-submit the quiz when time runs out
            submitQuiz(true);
        }
    });

    // Start the timer
    quizTimer.start();
}

/**
 * Set up event listeners for quiz interactions
 */
function setupEventListeners() {
    // Previous button click
    document.getElementById('prev-btn').addEventListener('click', showPreviousQuestion);

    // Next button click
    document.getElementById('next-btn').addEventListener('click', showNextQuestion);

    // Submit quiz button click
    document.getElementById('submit-quiz-btn').addEventListener('click', () => {
        // Show confirmation before submitting
        if (confirm('Are you sure you want to submit your quiz? This action cannot be undone.')) {
            submitQuiz(false);
        }
    });
}

/**
 * Display a question by index
 * @param {number} index - Question index to display
 */
function showQuestion(index) {
    if (!quiz || !quiz.questions || index < 0 || index >= quiz.questions.length) {
        return;
    }

    currentQuestionIndex = index;
    const question = quiz.questions[index];
    const container = document.getElementById('quiz-container');

    // Create question HTML
    const questionHTML = `
        <div class="question-card">
            <div class="card">
                <div class="card-body">
                    <h5 class="question-statement">${index + 1}. ${question.question_statement}</h5>
                    <div class="options-container">
                        <div class="form-check">
                            <input class="option-input" type="radio" name="question${index}" id="option${index}1" value="1" ${userAnswers[index] === 1 ? 'checked' : ''}>
                            <label class="option-label" for="option${index}1">${question.option1}</label>
                        </div>
                        <div class="form-check">
                            <input class="option-input" type="radio" name="question${index}" id="option${index}2" value="2" ${userAnswers[index] === 2 ? 'checked' : ''}>
                            <label class="option-label" for="option${index}2">${question.option2}</label>
                        </div>
                        <div class="form-check">
                            <input class="option-input" type="radio" name="question${index}" id="option${index}3" value="3" ${userAnswers[index] === 3 ? 'checked' : ''}>
                            <label class="option-label" for="option${index}3">${question.option3}</label>
                        </div>
                        <div class="form-check">
                            <input class="option-input" type="radio" name="question${index}" id="option${index}4" value="4" ${userAnswers[index] === 4 ? 'checked' : ''}>
                            <label class="option-label" for="option${index}4">${question.option4}</label>
                        </div>
                    </div>
                    <div class="mt-3">
                        <button id="clear-option-btn" class="btn btn-sm btn-outline-secondary ${userAnswers[index] === null ? 'disabled' : ''}">
                            Clear Selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = questionHTML;

    // Add event listeners to the radio options
    document.querySelectorAll(`input[name="question${index}"]`).forEach(radio => {
        radio.addEventListener('change', (e) => {
            userAnswers[index] = parseInt(e.target.value);
            updateUI();

            // Enable the clear button when an option is selected
            document.getElementById('clear-option-btn').classList.remove('disabled');
        });
    });

    // Add event listener to the clear selection button
    document.getElementById('clear-option-btn').addEventListener('click', () => {
        // Reset the user answer for this question
        userAnswers[index] = null;

        // Uncheck all radio buttons
        document.querySelectorAll(`input[name="question${index}"]`).forEach(radio => {
            radio.checked = false;
        });

        // Disable the clear button
        document.getElementById('clear-option-btn').classList.add('disabled');

        updateUI();
    });

    // Update navigation buttons
    updateNavigationButtons();

    // Update progress indicators
    updateProgressIndicators();
}

/**
 * Show the next question
 */
function showNextQuestion() {
    if (currentQuestionIndex < quiz.questions.length - 1) {
        showQuestion(currentQuestionIndex + 1);
    }
}

/**
 * Show the previous question
 */
function showPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
    }
}

/**
 * Update the navigation buttons based on current position
 */
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-quiz-btn');

    // Disable previous button on first question
    prevBtn.disabled = currentQuestionIndex === 0;

    // Show submit button and hide next button on last question
    if (currentQuestionIndex === quiz.questions.length - 1) {
        nextBtn.classList.add('d-none');
        submitBtn.classList.remove('d-none');
    } else {
        nextBtn.classList.remove('d-none');
        submitBtn.classList.add('d-none');
    }
}

/**
 * Update progress indicators
 */
function updateProgressIndicators() {
    // Update question counter
    document.getElementById('question-progress').textContent = `Question ${currentQuestionIndex + 1} of ${quiz.questions.length}`;

    // Update progress bar
    const progressPercentage = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercentage}%`;
    document.getElementById('progress-bar').setAttribute('aria-valuenow', progressPercentage);
}

/**
 * Update UI elements based on current state
 */
function updateUI() {
    updateNavigationButtons();
    updateProgressIndicators();
}

/**
 * Submit the quiz with all user answers
 * @param {boolean} isAutoSubmit - Whether the submission is automatic (timer expired)
 */
async function submitQuiz(isAutoSubmit = false) {
    // Make sure we have loaded quiz data before proceeding
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        console.error('Cannot submit quiz: quiz data not loaded');
        return;
    }

    // Stop the timer if it's running
    if (quizTimer && quizTimer.isActive()) {
        quizTimer.stop();
    }

    // Check if there are unanswered questions
    const unansweredCount = userAnswers.filter(answer => answer === null).length;

    // Only show confirmation for manual submissions
    if (!isAutoSubmit && unansweredCount > 0) {
        const confirmSubmit = confirm(`You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`);
        if (!confirmSubmit) {
            // Resume timer if user cancels
            if (quizTimer) {
                quizTimer.resume();
            }
            return;
        }
    }

    try {
        // Prepare submission data
        const quizId = new URLSearchParams(window.location.search).get('quiz_id');
        const answersToSubmit = quiz.questions.map((question, index) => {
            // Only include selected_option if the user actually selected something
            const answer = {
                question_id: question.id
            };

            if (userAnswers[index] !== null) {
                answer.selected_option = userAnswers[index];
            }

            return answer;
        });

        // Show loading state
        document.getElementById('quiz-container').innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Submitting your answers...</p>
            </div>
        `;

        // Submit answers to API
        const result = await submitQuizAnswers(quizId, answersToSubmit);

        // Show success message
        showSuccess('Quiz submitted successfully! Redirecting to results...');

        // Redirect to quiz results page
        setTimeout(() => {
            window.location.href = `/pages/users/quiz-result.html?quiz_id=${quizId}`;
        }, 2000);

    } catch (error) {
        showError(error.message || 'Failed to submit quiz');

        // Allow resubmit
        document.getElementById('submit-quiz-btn').disabled = false;
    }
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