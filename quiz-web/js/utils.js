// Utility functions for the application

// Import the logout API function
import { logout as logoutApi } from '/js/api/auth.js';

export function showError(message) {
    // Create alert div
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
    alertDiv.role = 'alert';

    // Add message
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Find alert container
    const alertContainer = document.querySelector('.alert-container') || document.querySelector('main');

    // Insert alert at the top
    alertContainer.insertBefore(alertDiv, alertContainer.firstChild);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

export function showSuccess(message) {
    // Create alert div
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
    alertDiv.role = 'alert';

    // Add message
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Find alert container
    const alertContainer = document.querySelector('.alert-container') || document.querySelector('main');

    // Insert alert at the top
    alertContainer.insertBefore(alertDiv, alertContainer.firstFirst);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

export function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

export async function logout() {
    try {
        // Call the logout API to blacklist the token
        await logoutApi();
    } catch (error) {
        console.error('Error during logout:', error);
        // Continue with local logout even if API call fails
    } finally {
        // Always clear local storage
        clearUserData();
        window.location.href = '/index.html';
    }
}

// Helper function to clear user data
export function clearUserData() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
}

// Make logout available globally
window.logout = logout;
window.showError = showError;
window.showSuccess = showSuccess;
window.isAuthenticated = isAuthenticated;

// Handle API responses and check for unauthorized access
export async function handleApiResponse(response) {
    if (response.status === 401) {
        // JWT expired or invalid - log out user
        logout();
        throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }

    return await response.json();
} 