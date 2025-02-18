# Quiz Web

## Setup

1. Create a `.env.js` file based on `.env.js.example`
2. Run the app

    ```bash
    npx http-server . -p 5000 --cors -c-1
    ```

```
quiz-web/
├── index.html           # Main entry point/landing page
├── css/
│   └── style.css       # Global styles
├── js/
│   ├── api.js          # API communication functions
│   ├── auth.js         # Authentication logic
│   ├── admin.js        # Admin dashboard functionality
│   ├── user.js         # User dashboard functionality
│   └── utils.js        # Utility functions (error handling, validation, etc)
└── pages/
    ├── auth/
    │   ├── login.html      # Login page
    │   └── register.html   # Registration page
    ├── admin/
    │   ├── dashboard.html  # Admin dashboard
    │   ├── users.html      # User management
    │   ├── subjects.html   # Subject management
    │   ├── chapters.html   # Chapter management
    │   └── quizzes.html    # Quiz management
    └── user/
        ├── dashboard.html  # User dashboard
        ├── quizzes.html    # Available quizzes
        ├── attempt.html    # Quiz attempt interface
        └── results.html    # Quiz results
```