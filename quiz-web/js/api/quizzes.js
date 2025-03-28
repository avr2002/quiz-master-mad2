const API_BASE_URL = config.API_URL;

// Import handleApiResponse from utils
import { handleApiResponse } from '/js/utils.js';

/**
 * Get all quizzes for a specific chapter
 * @param {number} chapterId - The ID of the chapter
 * @returns {Promise<Array>} - Array of quiz objects
 */
export async function getQuizzes(chapterId) {
    try {
        const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/quizzes`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        throw error;
    }
}

/**
 * Get a specific quiz by ID
 * @param {number} quizId - The ID of the quiz
 * @returns {Promise<Object>} - Quiz object
 */
export async function getQuiz(quizId) {
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching quiz:', error);
        throw error;
    }
}

/**
 * Create a new quiz
 * @param {number} chapterId - The ID of the chapter
 * @param {Object} data - Quiz data (date_of_quiz, time_duration, remarks)
 * @returns {Promise<Object>} - Created quiz object
 */
export async function createQuiz(chapterId, data) {
    try {
        const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/quizzes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error creating quiz:', error);
        throw error;
    }
}

/**
 * Update an existing quiz
 * @param {number} quizId - The ID of the quiz to update
 * @param {Object} data - Updated quiz data
 * @returns {Promise<Object>} - Updated quiz object
 */
export async function updateQuiz(quizId, data) {
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error updating quiz:', error);
        throw error;
    }
}

/**
 * Delete a quiz
 * @param {number} quizId - The ID of the quiz to delete
 * @returns {Promise<boolean>} - True if successful
 */
export async function deleteQuiz(quizId) {
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        await handleApiResponse(response);
        return true;
    } catch (error) {
        console.error('Error deleting quiz:', error);
        throw error;
    }
}

/**
 * Search quizzes within a chapter
 * @param {number} chapterId - The ID of the chapter
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results (default: 10)
 * @param {number} offset - Number of results to skip (default: 0)
 * @returns {Promise<Object>} - Search results with metadata
 */
export async function searchQuizzes(chapterId, query, limit = 10, offset = 0) {
    try {
        const params = new URLSearchParams({
            q: query,
            limit,
            offset
        });

        const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/quizzes/search?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error searching quizzes:', error);
        throw error;
    }
}

/**
 * Format a date string for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string (e.g., "Jan 15, 2023 2:30 PM")
 */
export function formatQuizDate(dateString) {
    if (!dateString) return '';

    // Ensure we have the Z suffix for UTC time
    let parsedDateString = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
        parsedDateString = dateString + 'Z';
    }

    // Create a date object - this will be in UTC
    const date = new Date(parsedDateString);

    // Format the date in the local timezone
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

/**
 * Convert a UTC ISO date string to local datetime format for form inputs
 * @param {string} utcDateString - ISO date string from the server
 * @returns {string} - Formatted local datetime string for datetime-local input
 */
export function utcToLocalDateTime(utcDateString) {
    if (!utcDateString) return '';

    // Ensure we have the Z suffix for UTC time
    let parsedDateString = utcDateString;
    if (!utcDateString.endsWith('Z') && !utcDateString.includes('+')) {
        parsedDateString = utcDateString + 'Z';
    }

    // Parse the UTC date string
    const date = new Date(parsedDateString);

    // Format for datetime-local input in local timezone (YYYY-MM-DDTHH:MM)
    // padStart ensures 2 digits with leading zeros
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const localTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    return localTimeString;
}

/**
 * Convert a local datetime string to UTC ISO format for API submission
 * @param {string} localDateTimeString - Local datetime string from datetime-local input
 * @returns {string} - ISO date string in UTC timezone
 */
export function localDateTimeToUTC(localDateTimeString) {
    if (!localDateTimeString) return '';

    // Parse the local datetime string into its parts
    const [datePart, timePart] = localDateTimeString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Create a date using the local components and get its UTC equivalent
    const localDate = new Date(year, month - 1, day, hours, minutes);

    // Get the UTC components
    const utcYear = localDate.getUTCFullYear();
    const utcMonth = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const utcDay = String(localDate.getUTCDate()).padStart(2, '0');
    const utcHours = String(localDate.getUTCHours()).padStart(2, '0');
    const utcMinutes = String(localDate.getUTCMinutes()).padStart(2, '0');
    const utcSeconds = String(localDate.getUTCSeconds()).padStart(2, '0');

    // Format as ISO string (YYYY-MM-DDTHH:MM:SS.sssZ)
    const utcString = `${utcYear}-${utcMonth}-${utcDay}T${utcHours}:${utcMinutes}:${utcSeconds}.000Z`;
    return utcString;
}

/**
 * Format a time duration string for display
 * @param {string} duration - Time duration in format "HH:MM"
 * @returns {string} - Formatted duration string (e.g., "1 hour 30 minutes")
 */
export function formatDuration(duration) {
    if (!duration) return '';

    const [hours, minutes] = duration.split(':').map(Number);

    let result = '';
    if (hours > 0) {
        result += `${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    if (minutes > 0) {
        if (result) result += ' ';
        result += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    return result || '0 minutes';
}

/**
 * Get all upcoming quizzes
 * @returns {Promise<Array>} - Array of upcoming quiz objects
 */
export async function getUpcomingQuizzes() {
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes/upcoming`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching upcoming quizzes:', error);
        throw error;
    }
}

/**
 * Get all past quizzes
 * @returns {Promise<Array>} - Array of past quiz objects
 */
export async function getPastQuizzes() {
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes/past`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching past quizzes:', error);
        throw error;
    }
}

/**
 * Get all ongoing quizzes
 * @returns {Promise<Array>} - Array of ongoing quiz objects
 */
export async function getOngoingQuizzes() {
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes/ongoing`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching ongoing quizzes:', error);
        throw error;
    }
} 