// Use API URL from config
const API_BASE_URL = config.API_URL;

// Import handleApiResponse from utils
import { handleApiResponse } from '/js/utils.js';

export async function login({ email, username, password }) {
    // Create login data with either email or username
    const loginData = {
        password,
        ...(email ? { email } : { username })
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.details) {
                // Pydantic validation error format
                const errorMsgs = errorData.details.map(err => err.msg);
                throw new Error(errorMsgs.join('\n'));
            } else {
                // Custom API error format
                throw new Error(errorData.message || 'Login failed');
            }
        }

        const data = await response.json();
        // Store token in localStorage
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userName', data.user.username);
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

export async function register(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.details) {
                // Pydantic validation error format
                const errorMsgs = errorData.details.map(err => err.msg);
                throw new Error(errorMsgs.join('\n'));
            } else {
                // Custom API error format
                throw new Error(errorData.message || 'Registration failed');
            }
        }

        return await response.json();
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

export async function getCurrentUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

export async function updateProfile(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

export async function logout() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        // Even if the server response fails, we'll still log out locally
        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error during logout:', error);
        // We still want to clear local storage even if the API call fails
        throw error;
    }
} 