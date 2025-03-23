import { getCurrentUser, updateProfile } from '/js/api/auth.js';
import { isAuthenticated } from '/js/utils.js';

// Check if user is authenticated
if (!isAuthenticated()) {
    window.location.href = '/pages/auth/login.html';
}

// Load user data
async function loadProfile() {
    try {
        const user = await getCurrentUser();
        document.getElementById('username').value = user.username;
        document.getElementById('email').value = user.email;
        document.getElementById('full_name').value = user.full_name;
        document.getElementById('dob').value = user.dob ? new Date(user.dob).toISOString().split('T')[0] : '';
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
        await updateProfile(data);
        showSuccess('Profile updated successfully');
    } catch (error) {
        showError(error.message);
    }
});

// Load profile when page loads
loadProfile();
