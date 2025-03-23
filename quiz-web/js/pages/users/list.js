import { getAllUsers, getUser, searchUsers, formatDob, formatJoinDate } from '/js/api/users.js';
import { showError, isAuthenticated } from '/js/utils.js';

// Initialize the users page
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is authenticated and is admin
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = '/pages/hello.html';
        return;
    }

    // Load all users
    loadUsers();

    // Set up quick search
    document.getElementById('quick-search-btn').addEventListener('click', handleQuickSearch);
    document.getElementById('quick-search').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleQuickSearch();
        }
    });
});

// Load all users
export async function loadUsers() {
    const tableBody = document.getElementById('usersTableBody');
    const noUsersMessage = document.getElementById('no-users-message');

    try {
        const users = await getAllUsers();

        if (!users || users.length === 0) {
            tableBody.innerHTML = '';
            noUsersMessage.style.display = 'block';
            return;
        }

        noUsersMessage.style.display = 'none';
        renderUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">
                    Failed to load users. ${error.message || ''}
                </td>
            </tr>
        `;
    }
}

// Handle quick search
export async function handleQuickSearch() {
    const searchQuery = document.getElementById('quick-search').value.trim();

    if (!searchQuery) {
        // If search is empty, load all users
        loadUsers();
        return;
    }

    try {
        const result = await searchUsers(searchQuery);
        renderUsers(result.items);

        // Show no results message if needed
        const noUsersMessage = document.getElementById('no-users-message');
        if (!result.items || result.items.length === 0) {
            noUsersMessage.style.display = 'block';
        } else {
            noUsersMessage.style.display = 'none';
        }
    } catch (error) {
        console.error('Error searching users:', error);
        showError('Failed to search users');
    }
}

// Render users in the table
export function renderUsers(users) {
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.full_name || '-'}</td>
            <td>${user.email}</td>
            <td><span class="role-badge role-${user.role}">${user.role}</span></td>
            <td>${formatDob(user.dob)}</td>
            <td>${formatJoinDate(user.joined_at)}</td>
            <td>
                <button class="btn btn-sm btn-info view-user-btn" data-user-id="${user.id}">
                    <i class="bi bi-eye"></i> View
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // Add event listeners to view buttons
    document.querySelectorAll('.view-user-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const userId = this.getAttribute('data-user-id');
            viewUserDetails(userId);
        });
    });
}

// View user details in modal
export async function viewUserDetails(userId) {
    const modalContent = document.getElementById('user-details-content');
    modalContent.innerHTML = '<p class="text-center">Loading user details...</p>';

    // Store the trigger button for focus restoration
    const triggerElement = document.activeElement;

    // Get modal element
    const modalElement = document.getElementById('userDetailsModal');

    // Show modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    try {
        const user = await getUser(userId);

        modalContent.innerHTML = `
            <div class="text-center mb-3">
                <div class="display-1">
                    <i class="bi bi-person-circle text-secondary"></i>
                </div>
                <h4>${user.full_name || user.username}</h4>
                <span class="role-badge role-${user.role}">${user.role}</span>
            </div>
            <ul class="list-group">
                <li class="list-group-item d-flex justify-content-between">
                    <strong>Username:</strong> <span>${user.username}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                    <strong>Email:</strong> <span>${user.email}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                    <strong>Date of Birth:</strong> <span>${formatDob(user.dob)}</span>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                    <strong>Joined:</strong> <span>${formatJoinDate(user.joined_at)}</span>
                </li>
            </ul>
        `;
    } catch (error) {
        console.error('Error fetching user details:', error);
        modalContent.innerHTML = `
            <div class="alert alert-danger">
                Failed to load user details. ${error.message || ''}
            </div>
        `;
    }
}
