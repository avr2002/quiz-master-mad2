import { getUser, searchUsers, formatDob, formatJoinDate } from '/js/api/users.js';
import { isAuthenticated } from '/js/utils.js';

// Search state
let currentPage = 1;
let currentSearchParams = {};
let totalPages = 1;

// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
    // Check if user is authenticated and is admin
    if (!isAuthenticated()) {
        window.location.href = '/pages/auth/login.html';
        return;
    } else if (localStorage.getItem('userRole') !== 'admin') {
        window.location.href = '/pages/hello.html';
        return;
    }

    // Set up search form
    document.getElementById('advanced-search-form').addEventListener('submit', function (e) {
        e.preventDefault();
        currentPage = 1;
        performSearch();
    });

    // Set up pagination
    document.getElementById('prev-page').addEventListener('click', function () {
        if (currentPage > 1) {
            currentPage--;
            performSearch();
        }
    });

    document.getElementById('next-page').addEventListener('click', function () {
        if (currentPage < totalPages) {
            currentPage++;
            performSearch();
        }
    });
});

// Perform search with current parameters
export async function performSearch() {
    const searchTerm = document.getElementById('search-term').value.trim();
    const role = document.getElementById('role-filter').value;
    const joinDateFrom = document.getElementById('join-date-from').value;
    const joinDateTo = document.getElementById('join-date-to').value;
    const limit = parseInt(document.getElementById('limit').value);
    const offset = (currentPage - 1) * limit;

    // Build search parameters
    currentSearchParams = {
        query: searchTerm,
        role: role || undefined,
        join_date_from: joinDateFrom || undefined,
        join_date_to: joinDateTo || undefined,
        limit: limit,
        offset: offset
    };

    // Clean up undefined parameters
    Object.keys(currentSearchParams).forEach(key =>
        currentSearchParams[key] === undefined && delete currentSearchParams[key]
    );

    // Update UI to loading state
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center">
                <div class="spinner-border spinner-border-sm text-secondary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                Searching...
            </td>
        </tr>
    `;
    document.getElementById('results-summary').style.display = 'none';
    document.getElementById('no-results-message').style.display = 'none';

    try {
        const result = await searchUsers(
            currentSearchParams.query,
            currentSearchParams.limit,
            currentSearchParams.offset,
            {
                role: currentSearchParams.role,
                join_date_from: currentSearchParams.join_date_from,
                join_date_to: currentSearchParams.join_date_to
            }
        );

        // Show results count
        document.getElementById('result-count').textContent = result.total;
        document.getElementById('results-summary').style.display = 'block';

        // Update pagination
        totalPages = Math.ceil(result.total / limit);
        updatePaginationUI();

        // Show results or no results message
        if (!result.items || result.items.length === 0) {
            tableBody.innerHTML = '';
            document.getElementById('no-results-message').style.display = 'block';
        } else {
            document.getElementById('no-results-message').style.display = 'none';
            renderUsers(result.items);
        }
    } catch (error) {
        console.error('Error searching users:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">
                    Failed to search users. ${error.message || ''}
                </td>
            </tr>
        `;
    }
}

// Update pagination UI
export function updatePaginationUI() {
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
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
