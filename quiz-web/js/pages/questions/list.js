import { getQuiz, formatQuizDate, formatDuration } from '/js/api/quizzes.js';
import { getChapter } from '/js/api/chapters.js';
import { getQuizQuestions, deleteQuestion } from '/js/api/questions.js';

// Initialize the questions list page
export function initQuestionsList() {
    // Check if user is authenticated and is admin
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = '/pages/hello.html';
        return;
    }

    // Get quiz ID and chapter ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz_id');
    const chapterId = urlParams.get('chapter_id');

    if (!quizId || !chapterId) {
        showError('Quiz ID and Chapter ID are required');
        return;
    }

    // Set up Add Question button
    const addQuestionBtn = document.getElementById('add-question-btn');
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
            window.location.href = `/pages/admin/questions/edit.html?chapter_id=${chapterId}&quiz_id=${quizId}`;
        });
    }

    // Load quiz details and questions
    // The setupBreadcrumbs will be called from loadQuestions if the API returns the necessary data
    loadQuizDetails(quizId);
    loadQuestions(quizId);
}

// Setup breadcrumb navigation
async function setupBreadcrumbs(chapterId, quizId) {
    try {
        // Setup chapter link in breadcrumb
        const chapter = await getChapter(chapterId);
        const chapterBreadcrumb = document.getElementById('chapter-breadcrumb');

        if (chapterBreadcrumb && chapter) {
            chapterBreadcrumb.innerHTML = `<a href="/pages/admin/chapters/list.html?subject_id=${chapter.subject_id}">${chapter.name}</a>`;
        } else {
            console.error('Chapter information or breadcrumb element not found');
        }

        // Setup quiz link in breadcrumb
        const quiz = await getQuiz(quizId);
        const quizBreadcrumb = document.getElementById('quiz-breadcrumb');

        if (quizBreadcrumb && quiz) {
            quizBreadcrumb.innerHTML = `<a href="/pages/admin/quizzes/list.html?chapter_id=${chapterId}">${quiz.name}</a>`;
        } else {
            console.error('Quiz information or breadcrumb element not found');
        }
    } catch (error) {
        console.error('Error setting up breadcrumbs:', error);
        showError('Failed to set up breadcrumb navigation');
    }
}

// Load quiz details
async function loadQuizDetails(quizId) {
    try {
        const quiz = await getQuiz(quizId);

        // Update page title and details
        const quizTitle = document.getElementById('quiz-title');
        const quizDetails = document.getElementById('quiz-details');

        if (quizTitle) {
            quizTitle.textContent = `Questions for ${quiz.name}`;
        }

        if (quizDetails) {
            quizDetails.innerHTML = `
                Date: ${formatQuizDate(quiz.date_of_quiz)} | 
                Duration: ${formatDuration(quiz.time_duration)}
            `;
        }

        // Update document title
        document.title = `Questions: ${quiz.name} - Admin Dashboard`;
    } catch (error) {
        console.error('Error loading quiz details:', error);
        showError('Failed to load quiz details');
    }
}

// Load questions for the quiz
async function loadQuestions(quizId) {
    try {
        const response = await getQuizQuestions(quizId);

        // Use returned metadata to setup breadcrumbs
        if (response.quiz_id && response.chapter_id && response.subject_id) {
            setupBreadcrumbsFromResponse(response);
        } else {
            // Fallback to manual breadcrumb setup if API doesn't return necessary data
            const urlParams = new URLSearchParams(window.location.search);
            const chapterId = urlParams.get('chapter_id');
            if (chapterId) {
                setupBreadcrumbs(chapterId, quizId);
            } else {
                console.error('Chapter ID not available for breadcrumb setup');
            }
        }

        displayQuizData(response);
    } catch (error) {
        console.error('Error loading questions:', error);
        showError('Failed to load questions');
    }
}

// Setup breadcrumb navigation from API response data
function setupBreadcrumbsFromResponse(response) {
    const { quiz_id, chapter_id, subject_id } = response;

    try {
        // Setup chapter breadcrumb
        const chapterElement = document.getElementById('chapter-breadcrumb');
        if (chapterElement && response.chapter_name && response.subject_id) {
            chapterElement.innerHTML = `<a href="/pages/admin/chapters/list.html?subject_id=${response.subject_id}">${response.chapter_name}</a>`;
        }

        // Setup quiz breadcrumb
        const quizElement = document.getElementById('quiz-breadcrumb');
        if (quizElement && response.quiz_name && response.chapter_id) {
            quizElement.innerHTML = `<a href="/pages/admin/quizzes/list.html?chapter_id=${response.chapter_id}">${response.quiz_name}</a>`;
        }
    } catch (error) {
        console.error('Error setting up breadcrumbs from response:', error);
    }
}

// Render questions in the table
function renderQuestions(questions, quizId) {
    const tableBody = document.getElementById('questionsTableBody');
    const urlParams = new URLSearchParams(window.location.search);
    const chapterId = urlParams.get('chapter_id');

    if (!questions || questions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    <p class="my-3">No questions found for this quiz.</p>
                    <button class="btn btn-primary" onclick="location.href='/pages/admin/questions/edit.html?chapter_id=${chapterId}&quiz_id=${quizId}'">
                        Add Question(s)
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    // We'll replace the inline event handlers with proper event listeners
    tableBody.innerHTML = questions.map((question, index) => {
        // Check which ID field is available in the question object
        let questionId = null;
        if (question.hasOwnProperty('id')) {
            questionId = question.id;
        } else if (question.hasOwnProperty('question_id')) {
            questionId = question.question_id;
        }

        if (!questionId) {
            console.error('Question is missing ID:', question);
        }

        return `
        <tr data-question-id="${questionId || ''}">
            <td>${question.question_statement}</td>
            <td>
                <ul class="option-list">
                    <li class="${question.correct_option === 1 ? 'correct-option' : ''}">1. ${question.option1}</li>
                    <li class="${question.correct_option === 2 ? 'correct-option' : ''}">2. ${question.option2}</li>
                    <li class="${question.correct_option === 3 ? 'correct-option' : ''}">3. ${question.option3}</li>
                    <li class="${question.correct_option === 4 ? 'correct-option' : ''}">4. ${question.option4}</li>
                </ul>
            </td>
            <td>${question.points}</td>
            <td>
                <button class="btn btn-sm btn-primary me-2 edit-btn" 
                        data-question-id="${questionId || ''}"
                        data-chapter-id="${chapterId}"
                        data-quiz-id="${quizId}">
                    Edit
                </button>
                <button class="btn btn-sm btn-danger delete-btn"
                        data-question-id="${questionId || ''}">
                    Delete
                </button>
            </td>
        </tr>
        `;
    }).join('');

    // Add event listeners after the HTML is added to the DOM
    setupQuestionActionButtons(chapterId, quizId);
}

// Setup event listeners for edit and delete buttons
function setupQuestionActionButtons(chapterId, quizId) {
    // Setup edit buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function () {
            const questionId = this.getAttribute('data-question-id');
            if (!questionId) {
                console.error('Edit button clicked but no question ID found');
                showError('Cannot edit question: Invalid question ID');
                return;
            }
            window.location.href = `/pages/admin/questions/edit.html?chapter_id=${chapterId}&quiz_id=${quizId}&id=${questionId}`;
        });
    });

    // Setup delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function () {
            const questionId = this.getAttribute('data-question-id');
            if (!questionId) {
                console.error('Delete button clicked but no question ID found');
                showError('Cannot delete question: Invalid question ID');
                return;
            }
            handleDelete(questionId);
        });
    });
}

// Handle question deletion
async function handleDelete(questionId) {
    if (confirm('Are you sure you want to delete this question?')) {
        try {
            await deleteQuestion(questionId);
            showSuccess('Question deleted successfully');

            // Get the quiz ID from the URL to reload questions
            const urlParams = new URLSearchParams(window.location.search);
            const quizId = urlParams.get('quiz_id');
            loadQuestions(quizId);
        } catch (error) {
            console.error('Error deleting question:', error);
            showError('Failed to delete question');
        }
    }
}

// Make handleDelete available globally
window.handleDelete = handleDelete;

function displayQuizData(data) {
    // Update existing elements
    document.getElementById('quiz-title').textContent = `Questions for ${data.quiz_name}`;
    document.getElementById('quiz-details').textContent = `Subject: ${data.subject_name} | Chapter: ${data.chapter_name}`;

    // Update the breadcrumb navigation
    document.getElementById('chapter-breadcrumb').innerHTML = `<a href="/pages/admin/chapters/list.html?subject_id=${data.subject_id}">${data.chapter_name}</a>`;
    document.getElementById('quiz-breadcrumb').innerHTML = `<a href="/pages/admin/quizzes/list.html?chapter_id=${data.chapter_id}">${data.quiz_name}</a>`;

    // Update the quiz stats
    document.getElementById('total-questions').textContent = data.number_of_questions;
    document.getElementById('total-score').textContent = data.total_quiz_score;

    // Display the questions
    renderQuestions(data.questions, data.quiz_id);
} 