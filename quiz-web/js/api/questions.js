/**
 * Questions API module for interacting with quiz question endpoints.
 * These endpoints are primarily for admin users to manage quiz questions.
 */

const API_BASE_URL = config.API_URL;

// Import handleApiResponse from utils
import { handleApiResponse } from '/js/utils.js';

/**
 * Create one or more new questions for a quiz (Admin only)
 * 
 * @param {number} quizId - The ID of the quiz to add questions to
 * @param {Array} questions - Array of question objects with required fields
 * @returns {Promise<Object>} - Promise with the created questions data
 */
export async function createQuestions(quizId, questions) {
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ questions })
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error creating questions:', error);
        throw error;
    }
}

/**
 * Get all questions for a specific quiz
 * 
 * @param {number} quizId - The ID of the quiz to get questions for
 * @returns {Promise<Object>} - Promise with the quiz questions and metadata
 */
export async function getQuizQuestions(quizId) {
    try {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/questions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching quiz questions:', error);
        throw error;
    }
}

/**
 * Get details of a specific question
 * 
 * @param {number} questionId - The ID of the question to get
 * @returns {Promise<Object>} - Promise with the question data
 */
export async function getQuestion(questionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching question:', error);
        throw error;
    }
}

/**
 * Update a specific question (Admin only)
 * 
 * @param {number} questionId - The ID of the question to update
 * @param {Object} questionData - Object with fields to update
 * @returns {Promise<Object>} - Promise with the updated question data
 */
export async function updateQuestion(questionId, questionData) {
    try {
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(questionData)
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error updating question:', error);
        throw error;
    }
}

/**
 * Delete a specific question (Admin only)
 * 
 * @param {number} questionId - The ID of the question to delete
 * @returns {Promise<Object>} - Promise with the deletion confirmation
 */
export async function deleteQuestion(questionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error deleting question:', error);
        throw error;
    }
}
