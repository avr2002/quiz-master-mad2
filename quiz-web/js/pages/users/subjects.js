import { getSubjects } from '/js/api/subjects.js';
import { isAuthenticated, showError } from '/js/utils.js';

// Initialize the subjects list page
export function initSubjectsList() {
    // Check if user is authenticated
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
    } else if (localStorage.getItem('userRole') !== 'user') {
        // Redirect admins to their subjects page
        window.location.href = '/pages/admin/subjects/list.html';
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
                <td colspan="2" class="text-center">No subjects found</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = subjects.map(subject => `
        <tr>
            <td>
                <a href="/pages/users/list/chapters.html?subject_id=${subject.id}">${subject.name}</a>
            </td>
            <td>${subject.description}</td>
        </tr>
    `).join('');
} 