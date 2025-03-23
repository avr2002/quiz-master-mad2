import { handleApiResponse } from '/js/utils.js';

const API_BASE_URL = config.API_URL;

/**
 * Get all users for admin
 * @returns {Promise<Array>} Promise that resolves to an array of user objects
 */
export async function getAllUsers() {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });

    return handleApiResponse(response);
}

/**
 * Get a specific user by ID
 * @param {string|number} userId - The ID of the user to retrieve
 * @returns {Promise<Object>} Promise that resolves to a user object
 */
export async function getUser(userId) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });

    return handleApiResponse(response);
}

/**
 * Search for users with optional filters
 * @param {string} query - Search query (optional)
 * @param {number} limit - Number of results to return (optional, default 25)
 * @param {number} offset - Number of results to skip (optional, default 0)
 * @param {Object} filters - Additional filters (optional)
 * @param {string} filters.role - Filter by role (optional)
 * @param {string} filters.join_date_from - Filter by join date from (ISO string, optional)
 * @param {string} filters.join_date_to - Filter by join date to (ISO string, optional)
 * @returns {Promise<Object>} Promise that resolves to search results object
 */
export async function searchUsers(query = '', limit = 25, offset = 0, filters = {}) {
    // Build URL parameters
    const params = new URLSearchParams();

    if (query) params.append('q', query);
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);

    // Add optional filters
    if (filters.role) params.append('role', filters.role);
    if (filters.join_date_from) params.append('join_date_from', filters.join_date_from);
    if (filters.join_date_to) params.append('join_date_to', filters.join_date_to);

    // Make request
    const response = await fetch(`${API_BASE_URL}/admin/users/search?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });

    return handleApiResponse(response);
}

/**
 * Format date of birth for display
 * @param {string} dob - ISO date string
 * @returns {string} Formatted date or 'Not provided'
 */
export function formatDob(dob) {
    if (!dob) return 'Not provided';

    try {
        const date = new Date(dob);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date of birth:', error);
        return dob;
    }
}

/**
 * Format join date for display
 * @param {string} joinDate - ISO date string
 * @returns {string} Formatted date and time
 */
export function formatJoinDate(joinDate) {
    if (!joinDate) return '';

    try {
        const date = new Date(joinDate);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting join date:', error);
        return joinDate;
    }
}
