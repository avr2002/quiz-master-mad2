import { getSubjects, deleteSubject } from '/js/api/subjects.js';

// Initialize the subjects list page
export function initSubjectsList() {
    // Check if user is authenticated and is admin
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
    } else if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = '/pages/hello.html';
    } else {
        // Load subjects when page loads
        loadSubjects();
    }
}

async function loadSubjects() {
    try {
        const subjects = await getSubjects();
        renderSubjects(subjects);
    } catch (error) {
        showError(error.message);
    }
}

function renderSubjects(subjects) {
    const tableBody = document.getElementById('subjectsTableBody');

    if (!subjects || subjects.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">No subjects found</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = subjects.map(subject => `
        <tr>
            <td>
                <a href="/pages/admin/chapters/list.html?subject_id=${subject.id}">${subject.name}</a>
            </td>
            <td>${subject.description}</td>
            <td>
                <button class="btn btn-sm btn-primary me-2" 
                        onclick="location.href='edit.html?id=${subject.id}'">
                    Edit
                </button>
                <button class="btn btn-sm btn-danger" 
                        onclick="handleDelete(${subject.id})">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Handle subject deletion
export async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this subject?')) {
        try {
            await deleteSubject(id);
            await loadSubjects(); // Reload the subjects list
            showSuccess('Subject deleted successfully');
        } catch (error) {
            showError(error.message);
        }
    }
}

// Make handleDelete available globally
window.handleDelete = handleDelete; 