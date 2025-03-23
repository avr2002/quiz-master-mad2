import { createSubject, getSubject, updateSubject } from '/js/api/subjects.js';

// Initialize the subject edit page
export function initSubjectEdit() {
    // Check if user is authenticated and is admin
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = '/pages/hello.html';
        return;
    }

    // Get subject ID from URL if editing
    const urlParams = new URLSearchParams(window.location.search);
    const subjectId = urlParams.get('id');

    // Load subject data if editing
    if (subjectId) {
        document.getElementById('pageTitle').textContent = 'Edit Subject';
        loadSubject(subjectId);
    }

    // Handle form submission
    setupFormSubmission(subjectId);
}

// Load subject data
async function loadSubject(id) {
    try {
        const subject = await getSubject(id);
        document.getElementById('name').value = subject.name;
        document.getElementById('description').value = subject.description;
    } catch (error) {
        showError(error.message);
    }
}

// Set up form submission
function setupFormSubmission(subjectId) {
    document.getElementById('subjectForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById('name').value,
            description: document.getElementById('description').value
        };

        try {
            if (subjectId) {
                await updateSubject(subjectId, data);
                showSuccess('Subject updated successfully');
            } else {
                await createSubject(data);
                showSuccess('Subject created successfully');
            }
            window.location.href = 'list.html';
        } catch (error) {
            showError(error.message);
        }
    });
} 