// Common head content
function getHead(title) {
    return `
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - Quiz Master</title>

        <!-- Bootstrap 5 CSS -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        
        <!-- Bootstrap Icons -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.2/font/bootstrap-icons.min.css">

        <!-- Custom CSS -->
        <link rel="stylesheet" href="/css/style.css">
    `;
}

// Common footer
function getFooter() {
    return `
        <footer class="footer mt-auto py-3 bg-light">
            <div class="container text-center">
                <span class="text-muted">© 2025 Quiz Master. All rights reserved.</span>
            </div>
        </footer>
    `;
}

// Get scripts for the footer
function getScripts() {
    return `
        <!-- Bootstrap JS Bundle with Popper -->
        <script defer src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
        <!-- Config -->
        <script defer src="/.env.js"></script>
        <script defer src="/js/config.js"></script>
        <!-- Utilities -->
        <script type="module" src="/js/utils.js"></script>
    `;
}
