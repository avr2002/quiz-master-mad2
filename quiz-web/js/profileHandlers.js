import { getCurrentUser, updateProfile } from '/js/api/auth.js';
import { isAuthenticated } from '/js/utils.js';

// Check if user is authenticated
if (!isAuthenticated()) {
    window.location.href = '/pages/auth/login.html';
}

// Simple function to convert date from DD/MM/YYYY to YYYY-MM-DD
function formatDateForInput(dateStr) {
    if (!dateStr) return '';

    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    return dateStr;
}

// Load user data
async function loadProfile() {
    try {
        const user = await getCurrentUser();
        document.getElementById('username').value = user.username;
        document.getElementById('email').value = user.email;
        document.getElementById('full_name').value = user.full_name;
        document.getElementById('dob').value = formatDateForInput(user.dob);
    } catch (error) {
        showError(error.message);
    }
}

// Handle form submission
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        username: document.getElementById('username').value,
        full_name: document.getElementById('full_name').value,
        dob: document.getElementById('dob').value || null
    };

    try {
        // Update the profile
        await updateProfile(data);

        // Fetch the updated user data
        const updatedUser = await getCurrentUser();

        // Update localStorage with new values
        localStorage.setItem('userName', updatedUser.username);
        localStorage.setItem('userFullName', updatedUser.full_name);

        showSuccess('Profile updated successfully');

        // Force a hard reload of the page after a short delay
        setTimeout(() => {
            window.location.reload(true);
        }, 1000);
    } catch (error) {
        showError(error.message);
    }
});

// Load profile when page loads
loadProfile();
