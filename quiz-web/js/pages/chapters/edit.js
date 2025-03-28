import { getChapter, createChapter, updateChapter } from '/js/api/chapters.js';
import { getSubject } from '/js/api/subjects.js';

// Initialize the chapter edit page
export function initChapterEdit() {
    // Check if user is authenticated and is admin
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = '/pages/hello.html';
        return;
    }

    // Get subject ID and chapter ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const subjectId = urlParams.get('subject_id');
    const chapterId = urlParams.get('id');

    if (!subjectId) {
        showError('Subject ID is required');
        return;
    }

    // Set up back button and chapters link
    setupNavigation(subjectId);

    // Load subject details
    loadSubjectDetails(subjectId);

    // Set up form
    if (chapterId) {
        // Edit existing chapter
        setupEditMode(subjectId, chapterId);
    } else {
        // Add new chapter
        setupAddMode(subjectId);
    }

    // Set up form submission
    setupFormSubmission(subjectId, chapterId);
}

// Set up navigation elements
function setupNavigation(subjectId) {
    // Set up back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = `/pages/admin/chapters/list.html?subject_id=${subjectId}`;
        });
    }

    // Set up chapters link in breadcrumb
    const chaptersLink = document.getElementById('chapters-link');
    if (chaptersLink) {
        chaptersLink.href = `/pages/admin/chapters/list.html?subject_id=${subjectId}`;
    }
}

// Load subject details
async function loadSubjectDetails(subjectId) {
    try {
        const subject = await getSubject(subjectId);

        // Update subject option
        const subjectOption = document.getElementById('subject-option');
        if (subjectOption) {
            subjectOption.textContent = subject.name;
            subjectOption.value = subject.id;
        }
    } catch (error) {
        showError(`Error loading subject details: ${error.message}`);
    }
}

// Set up edit mode
async function setupEditMode(subjectId, chapterId) {
    try {
        // Update page title and action
        document.getElementById('page-title').textContent = 'Edit Chapter';
        document.getElementById('page-action').textContent = 'Edit Chapter';
        document.getElementById('submit-btn').textContent = 'Update Chapter';
        document.title = 'Edit Chapter - Admin Dashboard';

        // Load chapter details
        const chapter = await getChapter(subjectId, chapterId);

        // Populate form fields
        document.getElementById('chapterName').value = chapter.name;
        document.getElementById('chapterDescription').value = chapter.description;
    } catch (error) {
        showError(`Error loading chapter details: ${error.message}`);
    }
}

// Set up add mode
function setupAddMode(subjectId) {
    // Update page title and action
    document.getElementById('page-title').textContent = 'Add New Chapter';
    document.getElementById('page-action').textContent = 'Add Chapter';
    document.getElementById('submit-btn').textContent = 'Save Chapter';
    document.title = 'Add New Chapter - Admin Dashboard';
}

// Set up form submission
function setupFormSubmission(subjectId, chapterId) {
    const form = document.getElementById('chapterForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Get form data
        const chapterData = {
            name: document.getElementById('chapterName').value.trim(),
            description: document.getElementById('chapterDescription').value.trim(),
            subject_id: parseInt(subjectId)
        };

        try {
            if (chapterId) {
                // Update existing chapter
                await updateChapter(chapterId, chapterData);
                showSuccess('Chapter updated successfully');
            } else {
                // Create new chapter
                await createChapter(subjectId, chapterData);
                showSuccess('Chapter created successfully');
            }

            // Redirect back to the chapters list page for this subject
            window.location.href = `list.html?subject_id=${subjectId}`;
        } catch (error) {
            showError(`Error saving chapter: ${error.message}`);
        }
    });
}

// Validate form
function validateForm() {
    const form = document.getElementById('chapterForm');
    const nameInput = document.getElementById('chapterName');
    const descriptionInput = document.getElementById('chapterDescription');

    let isValid = true;

    // Validate name
    if (nameInput.value.trim().length < 3) {
        nameInput.classList.add('is-invalid');
        isValid = false;
    } else {
        nameInput.classList.remove('is-invalid');
    }

    // Validate description
    if (descriptionInput.value.trim().length < 10) {
        descriptionInput.classList.add('is-invalid');
        isValid = false;
    } else {
        descriptionInput.classList.remove('is-invalid');
    }

    return isValid;
} 