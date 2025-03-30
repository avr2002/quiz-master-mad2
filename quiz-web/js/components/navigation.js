// Base navigation that's always shown (logo, home)
function getBaseNav() {
    return `
        <a class="navbar-brand" href="/">Quiz Master</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
    `;
}

// Homepage navigation - shows auth buttons or user info based on login state
function getHomeNav() {
    if (localStorage.getItem('token')) {
        const userName = localStorage.getItem('userName');
        // Get the user's full name from localStorage if available
        const fullName = localStorage.getItem('userFullName') || userName;

        return `
            ${getBaseNav()}
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <span class="nav-link text-light">Welcome, ${fullName}</span>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/pages/profile.html">Profile</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="logout()">Logout</a>
                    </li>
                </ul>
            </div>
        `;
    } else {
        return getAuthNav();  // Reuse existing auth nav for logged out state
    }
}

// Auth navigation (for login/register pages)
function getAuthNav() {
    return `
        ${getBaseNav()}
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item">
                    <a class="nav-link" href="/pages/auth/login.html">Login</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/pages/auth/register.html">Register</a>
                </li>
            </ul>
        </div>
    `;
}

// Admin navigation
function getAdminNav(userName) {
    // Get the user's full name from localStorage if available
    const fullName = localStorage.getItem('userFullName') || userName;

    return `
        ${getBaseNav()}
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
                <li class="nav-item">
                    <a class="nav-link" href="/pages/admin/subjects/list.html">Subjects</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/pages/admin/quizzes.html">Quizzes</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/pages/admin/users.html">Users</a>
                </li>
            </ul>
            <ul class="navbar-nav">
                <li class="nav-item">
                    <span class="nav-link text-light">Welcome, ${fullName}</span>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/pages/profile.html">Profile</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="logout()">Logout</a>
                </li>
            </ul>
        </div>
    `;
}

// User navigation
function getUserNav(userName) {
    // Get the user's full name from localStorage if available
    const fullName = localStorage.getItem('userFullName') || userName;

    return `
        ${getBaseNav()}
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
                <li class="nav-item">
                    <a class="nav-link" href="/pages/users/quizzes.html">Quizzes</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/pages/users/my-quizzes.html">My Quizzes</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/pages/users/list/subjects.html">Subjects</a>
                </li>
            </ul>
            <ul class="navbar-nav">
                <li class="nav-item">
                    <span class="nav-link text-light">Welcome, ${fullName}</span>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/pages/profile.html">Profile</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="logout()">Logout</a>
                </li>
            </ul>
        </div>
    `
}

// Logout function for navigation
function logout() {
    // Get the logout function from utils.js
    try {
        // Try to use the utils.js logout function
        window.logout();
    } catch (e) {
        // Fallback if utils.js logout is not available
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userFullName');
        window.location.href = '/index.html';
    }
}
