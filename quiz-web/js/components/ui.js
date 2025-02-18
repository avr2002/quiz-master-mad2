// Alert container
function getAlertContainer() {
    return `
        <div class="alert-container"></div>
    `;
}

// Card component
function getCard(title, content, footer = '') {
    return `
        <div class="card">
            ${title ? `
                <div class="card-header">
                    <h4 class="card-title mb-0">${title}</h4>
                </div>
            ` : ''}
            <div class="card-body">
                ${content}
            </div>
            ${footer ? `
                <div class="card-footer text-center">
                    ${footer}
                </div>
            ` : ''}
        </div>
    `;
} 