import { getChapters, deleteChapter } from '/js/api/chapters.js';
import { getSubject } from '/js/api/subjects.js';

// Initialize the chapters list page
export function initChaptersList() {
    // Check if user is authenticated and is admin
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = '/pages/hello.html';
        return;
    }

    // Get subject ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const subjectId = urlParams.get('subject_id');

    if (!subjectId) {
        showError('Subject ID is required');
        return;
    }

    // Set subject ID in the search form
    const subjectIdInput = document.getElementById('subject-id-input');
    if (subjectIdInput) {
        subjectIdInput.value = subjectId;
    }

    // Set up Add Chapter button
    const addChapterBtn = document.getElementById('add-chapter-btn');
    if (addChapterBtn) {
        addChapterBtn.addEventListener('click', () => {
            window.location.href = `/pages/admin/chapters/edit.html?subject_id=${subjectId}`;
        });
    }

    // Load subject details and chapters
    loadSubjectDetails(subjectId);
    loadChapters(subjectId);
}

// Load subject details
async function loadSubjectDetails(subjectId) {
    try {
        const subject = await getSubject(subjectId);

        // Update page title and description
        const subjectTitle = document.getElementById('subject-title');
        const subjectDescription = document.getElementById('subject-description');

        if (subjectTitle) {
            subjectTitle.textContent = `Chapters: ${subject.name}`;
        }

        if (subjectDescription) {
            subjectDescription.textContent = subject.description;
        }

        // Update document title
        document.title = `Chapters: ${subject.name} - Admin Dashboard`;
    } catch (error) {
        showError(`Error loading subject details: ${error.message}`);
    }
}

// Load chapters for the subject
async function loadChapters(subjectId) {
    try {
        const chapters = await getChapters(subjectId);
        renderChapters(chapters, subjectId);
    } catch (error) {
        showError(`Error loading chapters: ${error.message}`);
    }
}

// Render chapters in the table
function renderChapters(chapters, subjectId) {
    const tableBody = document.getElementById('chaptersTableBody');

    if (!chapters || chapters.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">
                    <p class="my-3">No chapters found for this subject.</p>
                    <button class="btn btn-primary" onclick="location.href='/pages/admin/chapters/edit.html?subject_id=${subjectId}'">
                        Add your first chapter
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = chapters.map(chapter => `
        <tr>
            <td>
                <a href="/pages/admin/quizzes/list.html?chapter_id=${chapter.id}">${chapter.name}</a>
            </td>
            <td>${chapter.description || 'No description'}</td>
            <td>
                <button class="btn btn-sm btn-primary me-2" 
                        onclick="location.href='/pages/admin/chapters/edit.html?subject_id=${subjectId}&id=${chapter.id}'">
                    Edit
                </button>
                <button class="btn btn-sm btn-danger" 
                        onclick="handleDelete(${chapter.id})">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Handle chapter deletion
export async function handleDelete(chapterId) {
    if (confirm('Are you sure you want to delete this chapter? This will also delete all quizzes associated with this chapter.')) {
        try {
            await deleteChapter(chapterId);
            showSuccess('Chapter deleted successfully');

            // Get the subject ID from the URL to reload chapters
            const urlParams = new URLSearchParams(window.location.search);
            const subjectId = urlParams.get('subject_id');
            loadChapters(subjectId);
        } catch (error) {
            showError(`Error deleting chapter: ${error.message}`);
        }
    }
}

// Make handleDelete available globally
window.handleDelete = handleDelete; 