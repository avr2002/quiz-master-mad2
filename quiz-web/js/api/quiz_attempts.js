const API_BASE_URL = config.API_URL;

// Import handleApiResponse from utils
import { handleApiResponse } from '/js/utils.js';

/**
 * Start a quiz attempt to get questions
 * @param {number} quizId - The ID of the quiz to attempt
 * @returns {Promise<Object>} - Quiz with questions
 */
export async function startQuizAttempt(quizId) {
    try {
        const response = await fetch(`${API_BASE_URL}/quiz/${quizId}/attempt`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error starting quiz attempt:', error);
        throw error;
    }
}

/**
 * Submit quiz answers
 * @param {number} quizId - The ID of the quiz
 * @param {Array} answers - Array of { question_id, selected_option } objects
 * @returns {Promise<Object>} - Submission result with score
 */
export async function submitQuizAnswers(quizId, answers) {
    try {
        const response = await fetch(`${API_BASE_URL}/quiz/${quizId}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answers })
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error submitting quiz answers:', error);
        throw error;
    }
}

/**
 * Get quiz attempt results with correct answers
 * @param {number} quizId - The ID of the quiz
 * @returns {Promise<Object>} - Detailed results with correct answers
 */
export async function getQuizAttemptResults(quizId) {
    try {
        const response = await fetch(`${API_BASE_URL}/quiz/${quizId}/results`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching quiz attempt results:', error);
        throw error;
    }
}

/**
 * Get user's score for a specific quiz
 * @param {number} quizId - The ID of the quiz
 * @returns {Promise<Object>} - Score details
 */
export async function getQuizScore(quizId) {
    try {
        const response = await fetch(`${API_BASE_URL}/quiz/${quizId}/score`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching quiz score:', error);
        throw error;
    }
}

/**
 * Get user's quiz attempt history
 * @returns {Promise<Array>} - Array of quiz attempt history
 */
export async function getQuizAttemptsHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/quiz/attempts/history`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching quiz attempts history:', error);
        throw error;
    }
}
