import { getOngoingQuizzes, getUpcomingQuizzes, getPastQuizzes, formatQuizDate, formatDuration } from '/js/api/quizzes.js';
import { signupForQuiz, getUserQuizzes } from '/js/api/quiz_registration.js';

// Initialize the quizzes dashboard
export function initQuizzesDashboard() {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') === 'admin') {
        window.location.href = '/pages/admin/quizzes.html';
        return;
    }

    // Load quizzes for each category
    loadOngoingQuizzes();
    loadUpcomingQuizzes();
    loadPastQuizzes();
}

// Load ongoing quizzes
export async function loadOngoingQuizzes() {
    const container = document.getElementById('ongoing-quizzes-container');
    try {
        const quizzes = await getOngoingQuizzes();
        renderQuizzes(container, quizzes, 'ongoing');
    } catch (error) {
        console.error('Error loading ongoing quizzes:', error);
        container.innerHTML = `
            <div class="col-12 no-quizzes">
                <p>No ongoing quizzes found</p>
            </div>
        `;
    }
}

// Load upcoming quizzes
export async function loadUpcomingQuizzes() {
    const container = document.getElementById('upcoming-quizzes-container');
    try {
        const quizzes = await getUpcomingQuizzes();
        renderQuizzes(container, quizzes, 'upcoming');
    } catch (error) {
        console.error('Error loading upcoming quizzes:', error);
        container.innerHTML = `
            <div class="col-12 no-quizzes">
                <p>No upcoming quizzes found</p>
            </div>
        `;
    }
}

// Load past quizzes
export async function loadPastQuizzes() {
    const container = document.getElementById('past-quizzes-container');
    try {
        const quizzes = await getPastQuizzes();
        renderQuizzes(container, quizzes, 'past');
    } catch (error) {
        console.error('Error loading past quizzes:', error);
        container.innerHTML = `
            <div class="col-12 no-quizzes">
                <p>No past quizzes found</p>
            </div>
        `;
    }
}

// Render quizzes in the container
export async function renderQuizzes(container, quizzes, type) {
    if (!quizzes || quizzes.length === 0) {
        container.innerHTML = `
            <div class="col-12 no-quizzes">
                <p>No ${type} quizzes found</p>
            </div>
        `;
        return;
    }

    let html = '';
    quizzes.forEach((quiz) => {
        const signupButton = type === 'upcoming' ?
            `<button onclick="signUpForQuiz(${quiz.id})" class="btn btn-success btn-sm signup-btn">
                <i class="bi bi-person-plus"></i> Sign Up
             </button>` : '';

        const viewQuestionsButton = type === 'past' ?
            `<a href="/pages/users/list-past-quiz-questions.html?quiz_id=${quiz.id}" class="btn btn-info btn-sm text-white">
                <i class="bi bi-question-circle"></i> View Questions
             </a>` : '';

        const takeQuizButton = type === 'ongoing' ?
            `<button onclick="verifyAndTakeQuiz(${quiz.id})" class="btn btn-primary btn-sm">
                <i class="bi bi-pencil-square"></i> Take Quiz
             </button>` : '';

        html += `
            <div class="col-md-6 col-lg-4">
                <div class="card quiz-card">
                    <div class="card-body">
                        <h5 class="card-title">${quiz.name}</h5>
                        <div class="quiz-subject mb-2">
                            <i class="bi bi-book"></i> ${quiz.subject_name}
                        </div>
                        <div class="quiz-chapter mb-2">
                            <i class="bi bi-bookmark"></i> ${quiz.chapter_name}
                        </div>
                        <div class="quiz-date mb-2">
                            <i class="bi bi-calendar-event"></i> ${formatQuizDate(quiz.date_of_quiz)}
                        </div>
                        <div class="quiz-duration mb-2">
                            <i class="bi bi-hourglass-split"></i> ${formatDuration(quiz.time_duration)}
                        </div>
                        <p class="card-text">${quiz.remarks || 'No additional information'}</p>
                        <div class="d-flex justify-content-between">
                            <div></div>
                            ${takeQuizButton}
                            ${signupButton}
                            ${viewQuestionsButton}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Check if user is signed up for quiz
export async function checkQuizSignup(quizId) {
    try {
        // Get all quizzes the user is signed up for
        const userQuizzes = await getUserQuizzes();

        // Check if the user is signed up for this specific quiz
        const isSignedUp = userQuizzes.some(quiz => quiz.id === quizId);

        return isSignedUp;
    } catch (error) {
        console.error('Error checking quiz signup:', error);
        return false;
    }
}

// Sign up for a quiz
export async function handleQuizSignup(quizId) {
    try {
        await signupForQuiz(quizId);
        showSuccess('Successfully signed up for the quiz!');
        // Reload upcoming quizzes to reflect changes
        loadUpcomingQuizzes();
        return true;
    } catch (error) {
        showError(error.message || 'Failed to sign up for quiz');
        return false;
    }
}

// Verify signup and take quiz
export async function verifyAndTakeQuiz(quizId) {
    try {
        const isSignedUp = await checkQuizSignup(quizId);

        if (isSignedUp) {
            // User is signed up, redirect to take quiz page
            window.location.href = `/pages/users/take-quiz.html?quiz_id=${quizId}`;
        } else {
            // User is not signed up, show error
            showError('Cannot take the quiz as you are not signed up for it.');
        }
    } catch (error) {
        showError(error.message || 'Failed to verify quiz signup status');
    }
} 