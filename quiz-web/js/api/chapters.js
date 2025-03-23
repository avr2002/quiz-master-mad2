const API_BASE_URL = config.API_URL;

// Import handleApiResponse from utils
import { handleApiResponse } from '/js/utils.js';

/**
 * Get all chapters for a specific subject
 * @param {number} subjectId - The ID of the subject
 * @returns {Promise<Array>} - Array of chapter objects
 */
export async function getChapters(subjectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/chapters`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching chapters:', error);
        throw error;
    }
}

/**
 * Get a specific chapter by ID
 * @param {number} chapterId - The ID of the chapter
 * @returns {Promise<Object>} - Chapter object
 */
export async function getChapter(chapterId) {
    try {
        const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching chapter:', error);
        throw error;
    }
}

/**
 * Create a new chapter
 * @param {number} subjectId - The ID of the subject
 * @param {Object} data - Chapter data (name, description)
 * @returns {Promise<Object>} - Created chapter object
 */
export async function createChapter(subjectId, data) {
    try {
        const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/chapters`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error creating chapter:', error);
        throw error;
    }
}

/**
 * Update an existing chapter
 * @param {number} chapterId - The ID of the chapter to update
 * @param {Object} data - Updated chapter data
 * @returns {Promise<Object>} - Updated chapter object
 */
export async function updateChapter(chapterId, data) {
    try {
        const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error updating chapter:', error);
        throw error;
    }
}

/**
 * Delete a chapter
 * @param {number} chapterId - The ID of the chapter to delete
 * @returns {Promise<boolean>} - True if successful
 */
export async function deleteChapter(chapterId) {
    try {
        const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        await handleApiResponse(response);
        return true;
    } catch (error) {
        console.error('Error deleting chapter:', error);
        throw error;
    }
}

/**
 * Search chapters within a subject
 * @param {number} subjectId - The ID of the subject
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results (default: 10)
 * @param {number} offset - Number of results to skip (default: 0)
 * @returns {Promise<Object>} - Search results with metadata
 */
export async function searchChapters(subjectId, query, limit = 10, offset = 0) {
    try {
        const params = new URLSearchParams({
            q: query,
            limit,
            offset
        });

        const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/chapters/search?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error searching chapters:', error);
        throw error;
    }
}
