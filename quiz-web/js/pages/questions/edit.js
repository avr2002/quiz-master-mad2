import { getQuiz } from '/js/api/quizzes.js';
import { getChapter } from '/js/api/chapters.js';
import { getQuestion, createQuestions, updateQuestion } from '/js/api/questions.js';

// Initialize the question edit page
export function initQuestionEdit() {
    // Check if user is authenticated and is admin
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = '/pages/hello.html';
        return;
    }

    // Get quiz ID, chapter ID and question ID (if editing) from URL
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz_id');
    const chapterId = urlParams.get('chapter_id');
    const questionId = urlParams.get('id');
    const isEditing = !!questionId;

    if (!quizId || !chapterId) {
        showError('Quiz ID and Chapter ID are required');
        return;
    }

    // Update page titles based on whether adding or editing
    updatePageTitle(isEditing);

    // Setup quiz ID in the form
    document.getElementById('quiz-id').value = quizId;

    // Setup cancel button
    document.getElementById('cancel-btn').addEventListener('click', () => {
        window.location.href = `/pages/admin/questions/list.html?chapter_id=${chapterId}&quiz_id=${quizId}`;
    });

    // Setup questions link in breadcrumb
    const questionsLink = document.getElementById('questions-link');
    if (questionsLink) {
        questionsLink.href = `/pages/admin/questions/list.html?chapter_id=${chapterId}&quiz_id=${quizId}`;
    }

    // Load chapter and quiz details for breadcrumb
    setupBreadcrumbs(chapterId, quizId);

    // If we're in editing mode, only allow one question
    if (isEditing) {
        document.getElementById('add-question-btn').style.display = 'none';
        // Load existing question data when editing
        loadQuestionData(questionId);
    } else {
        // Setup the "Add Question" button for adding multiple questions
        setupAddQuestionButton();
        // Setup the delete question buttons
        setupDeleteQuestionButtons();
    }

    // Setup form submission
    const questionsForm = document.getElementById('questions-form');
    if (questionsForm) {
        questionsForm.addEventListener('submit', (event) => {
            event.preventDefault();

            if (isEditing) {
                // Single question edit mode
                const questionData = collectQuestionData(0);
                handleUpdateQuestion(questionId, questionData, chapterId, quizId);
            } else {
                // Multiple questions add mode
                const questionsData = collectAllQuestionsData();
                handleCreateMultipleQuestions(quizId, questionsData, chapterId);
            }
        });
    }
}

// Update page title based on whether adding or editing
function updatePageTitle(isEditing) {
    const action = isEditing ? 'Edit' : 'Add';
    const pageTitle = isEditing ? 'Edit Question' : 'Add Multiple Questions';

    // Update page title elements
    document.title = `${pageTitle} - Admin Dashboard`;

    const pageAction = document.getElementById('page-action');
    if (pageAction) {
        pageAction.textContent = action;
    }

    const headerAction = document.getElementById('header-action');
    if (headerAction) {
        headerAction.textContent = action;
    }

    // Update header text if adding multiple questions
    if (!isEditing) {
        const headerElement = document.querySelector('h2');
        if (headerElement) {
            headerElement.innerHTML = 'Add Multiple Questions';
        }
    }
}

// Setup breadcrumb navigation
async function setupBreadcrumbs(chapterId, quizId) {
    try {
        // Setup chapter link in breadcrumb
        const chapter = await getChapter(chapterId);
        const chapterBreadcrumb = document.getElementById('chapter-breadcrumb');

        if (chapterBreadcrumb && chapter) {
            // Use chapter name in the breadcrumb
            chapterBreadcrumb.innerHTML = `<a href="/pages/admin/chapters/list.html?subject_id=${chapter.subject_id}">${chapter.name}</a>`;
        } else {
            console.error('Chapter information or breadcrumb element not found');
        }

        // Setup quiz link in breadcrumb
        const quiz = await getQuiz(quizId);
        const quizBreadcrumb = document.getElementById('quiz-breadcrumb');

        if (quizBreadcrumb && quiz) {
            // Use the quiz name for the breadcrumb
            quizBreadcrumb.innerHTML = `<a href="/pages/admin/quizzes/list.html?chapter_id=${chapterId}">${quiz.name}</a>`;
        } else {
            console.error('Quiz information or breadcrumb element not found');
        }
    } catch (error) {
        console.error('Error setting up breadcrumbs:', error);
        showError('Failed to set up breadcrumb navigation');
    }
}

// Load existing question data when editing
async function loadQuestionData(questionId) {
    try {
        const question = await getQuestion(questionId);

        // Populate form fields with question data
        document.getElementById('question-statement-0').value = question.question_statement;
        document.getElementById('option1-0').value = question.option1;
        document.getElementById('option2-0').value = question.option2;
        document.getElementById('option3-0').value = question.option3;
        document.getElementById('option4-0').value = question.option4;
        document.getElementById('correct-option-0').value = question.correct_option;
        document.getElementById('points-0').value = question.points;
    } catch (error) {
        console.error('Error loading question data:', error);
        showError('Failed to load question data');
    }
}

// Setup "Add Question" button functionality
function setupAddQuestionButton() {
    const addQuestionBtn = document.getElementById('add-question-btn');
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
            addQuestionForm();
        });
    }
}

// Add a new question form to the container
function addQuestionForm() {
    const questionsContainer = document.getElementById('questions-container');
    const questionItems = questionsContainer.querySelectorAll('.question-item');
    const newIndex = questionItems.length;

    // Create new question form
    const questionHtml = `
        <div class="question-item mb-4" data-question-index="${newIndex}">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Question ${newIndex + 1}</h5>
                    <button type="button" class="btn btn-danger btn-sm delete-question-btn">Remove</button>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="question-statement-${newIndex}" class="form-label">Question</label>
                        <textarea class="form-control" id="question-statement-${newIndex}" name="question_statement_${newIndex}" rows="3" required></textarea>
                    </div>

                    <div class="mb-3">
                        <label for="option1-${newIndex}" class="form-label">Option 1</label>
                        <input type="text" class="form-control" id="option1-${newIndex}" name="option1_${newIndex}" required>
                    </div>

                    <div class="mb-3">
                        <label for="option2-${newIndex}" class="form-label">Option 2</label>
                        <input type="text" class="form-control" id="option2-${newIndex}" name="option2_${newIndex}" required>
                    </div>

                    <div class="mb-3">
                        <label for="option3-${newIndex}" class="form-label">Option 3</label>
                        <input type="text" class="form-control" id="option3-${newIndex}" name="option3_${newIndex}" required>
                    </div>

                    <div class="mb-3">
                        <label for="option4-${newIndex}" class="form-label">Option 4</label>
                        <input type="text" class="form-control" id="option4-${newIndex}" name="option4_${newIndex}" required>
                    </div>

                    <div class="mb-3">
                        <label for="correct-option-${newIndex}" class="form-label">Correct Answer</label>
                        <select class="form-select" id="correct-option-${newIndex}" name="correct_option_${newIndex}" required>
                            <option value="1">Option 1</option>
                            <option value="2">Option 2</option>
                            <option value="3">Option 3</option>
                            <option value="4">Option 4</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label for="points-${newIndex}" class="form-label">Points</label>
                        <input type="number" class="form-control" id="points-${newIndex}" name="points_${newIndex}" min="1" value="1" required>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Append new question form to container
    questionsContainer.insertAdjacentHTML('beforeend', questionHtml);

    // Enable "Remove" button on first question if we have more than one question
    if (newIndex === 1) {
        const firstDeleteBtn = questionsContainer.querySelector('.question-item[data-question-index="0"] .delete-question-btn');
        if (firstDeleteBtn) {
            firstDeleteBtn.disabled = false;
        }
    }

    // Setup delete button for the new question
    setupDeleteQuestionButtons();
}

// Setup delete question buttons
function setupDeleteQuestionButtons() {
    const deleteButtons = document.querySelectorAll('.delete-question-btn');
    deleteButtons.forEach(button => {
        // Remove existing event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        // Add new event listener
        newButton.addEventListener('click', function () {
            const questionItem = this.closest('.question-item');
            questionItem.remove();

            // Update question numbers and indices
            updateQuestionNumbers();

            // If only one question remains, disable its delete button
            const remainingQuestions = document.querySelectorAll('.question-item');
            if (remainingQuestions.length === 1) {
                const singleDeleteBtn = remainingQuestions[0].querySelector('.delete-question-btn');
                if (singleDeleteBtn) {
                    singleDeleteBtn.disabled = true;
                }
            }
        });
    });
}

// Update question numbers after deletion
function updateQuestionNumbers() {
    const questionItems = document.querySelectorAll('.question-item');
    questionItems.forEach((item, index) => {
        // Update data attribute
        item.setAttribute('data-question-index', index);

        // Update question number in header
        const header = item.querySelector('.card-header h5');
        if (header) {
            header.textContent = `Question ${index + 1}`;
        }

        // Update form element IDs and names
        updateQuestionElementAttributes(item, index);
    });
}

// Update form element IDs and names with new index
function updateQuestionElementAttributes(questionItem, newIndex) {
    const elements = questionItem.querySelectorAll('input, textarea, select');
    elements.forEach(element => {
        const idParts = element.id.split('-');
        const fieldName = idParts[0];

        // Update ID attribute
        element.id = `${fieldName}-${newIndex}`;

        // Update name attribute
        const nameParts = element.name.split('_');
        element.name = `${nameParts[0]}_${newIndex}`;
    });
}

// Collect data for a single question
function collectQuestionData(index) {
    return {
        quiz_id: Number(document.getElementById('quiz-id').value),
        question_statement: document.getElementById(`question-statement-${index}`).value,
        option1: document.getElementById(`option1-${index}`).value,
        option2: document.getElementById(`option2-${index}`).value,
        option3: document.getElementById(`option3-${index}`).value,
        option4: document.getElementById(`option4-${index}`).value,
        correct_option: Number(document.getElementById(`correct-option-${index}`).value),
        points: Number(document.getElementById(`points-${index}`).value)
    };
}

// Collect data for all questions
function collectAllQuestionsData() {
    const questionItems = document.querySelectorAll('.question-item');
    const questionsData = [];

    questionItems.forEach(item => {
        const index = item.getAttribute('data-question-index');
        questionsData.push(collectQuestionData(index));
    });

    return questionsData;
}

// Handle creation of multiple questions
async function handleCreateMultipleQuestions(quizId, questionsData, chapterId) {
    try {
        // Show loading state
        const submitButton = document.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Saving...';
        submitButton.disabled = true;

        await createQuestions(quizId, questionsData);
        showSuccess(`Successfully created ${questionsData.length} questions`);

        // Redirect to questions list
        setTimeout(() => {
            window.location.href = `/pages/admin/questions/list.html?chapter_id=${chapterId}&quiz_id=${quizId}`;
        }, 1500);
    } catch (error) {
        console.error('Error creating questions:', error);
        showError('Failed to create questions');

        // Reset button state
        const submitButton = document.querySelector('button[type="submit"]');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Handle single question update
async function handleUpdateQuestion(questionId, questionData, chapterId, quizId) {
    try {
        await updateQuestion(questionId, questionData);
        showSuccess('Question updated successfully');

        // Redirect to questions list
        setTimeout(() => {
            window.location.href = `/pages/admin/questions/list.html?chapter_id=${chapterId}&quiz_id=${quizId}`;
        }, 1000);
    } catch (error) {
        console.error('Error updating question:', error);
        showError('Failed to update question');
    }
}
