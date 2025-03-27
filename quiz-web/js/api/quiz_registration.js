const API_BASE_URL = config.API_URL;

// Import handleApiResponse from utils
import { handleApiResponse } from '/js/utils.js';

/**
 * Sign up for a quiz
 * @param {number} quizId - The ID of the quiz to sign up for
 * @returns {Promise<Object>} - Response message
 */
export async function signupForQuiz(quizId) {
    try {
        const response = await fetch(`${API_BASE_URL}/quiz-registration/${quizId}/signup`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error signing up for quiz:', error);
        throw error;
    }
}

/**
 * Cancel quiz registration
 * @param {number} quizId - The ID of the quiz to cancel registration for
 * @returns {Promise<Object>} - Response message
 */
export async function cancelQuizSignup(quizId) {
    try {
        const response = await fetch(`${API_BASE_URL}/quiz-registration/${quizId}/cancel`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error canceling quiz registration:', error);
        throw error;
    }
}

/**
 * Get all quizzes that the current user has signed up for
 * @returns {Promise<Array>} - Array of quiz objects
 */
export async function getUserQuizzes() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/quizzes/signups`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching user quizzes:', error);
        throw error;
    }
}
