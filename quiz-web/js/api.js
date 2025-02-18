// Use API URL from config
const API_BASE_URL = config.API_URL;

async function login({ email, username, password }) {
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


async function register(userData) {
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
            console.log(errorData);
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