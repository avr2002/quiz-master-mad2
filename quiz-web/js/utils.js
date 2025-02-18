// Utility functions for the application

function showError(message) {
    // Create alert div
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
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

function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
} 