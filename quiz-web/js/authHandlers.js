import { login, register } from '/js/api/auth.js';

// Handle login form submission
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Check if at least one identifier is provided
    if (!email && !username) {
        showError('Please provide either email or username');
        return;
    }

    try {
        const data = await login({ email, username, password });
        // For now, redirect everyone to hello.html
        window.location.href = '/pages/hello.html';
    } catch (error) {
        showError(error.message);
    }
});

// Handle registration form submission
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data first
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const fullName = document.getElementById('full_name').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    // Frontend validation matching backend rules
    const validationErrors = [];

    // Username validation (min_length=3, max_length=80)
    if (username.length < 3 || username.length > 80) {
        validationErrors.push('Username must be between 3 and 80 characters');
    }

    // Password validation (min_length=6, max_length=120)
    if (password.length < 6 || password.length > 120) {
        validationErrors.push('Password must be between 6 and 120 characters');
    }

    // Full name validation (min_length=1, max_length=120)
    if (fullName.length < 1 || fullName.length > 120) {
        validationErrors.push('Full name must be between 1 and 120 characters');
    }

    // Password match validation
    if (password !== confirmPassword) {
        validationErrors.push('Passwords do not match');
    }

    // Show validation errors if any
    if (validationErrors.length > 0) {
        showError(validationErrors.join('\n\n'));
        return;
    }

    // Get form data
    const userData = {
        username,
        email,
        full_name: fullName,
        password: password,
        dob: document.getElementById('dob').value || null,
        role: 'user' // Default role for registration
    };

    try {
        await register(userData);
        // Redirect to login page after successful registration
        window.location.href = '/pages/auth/login.html';
    } catch (error) {
        showError(error.message);
    }
}); 