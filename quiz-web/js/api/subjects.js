const API_BASE_URL = config.API_URL;

// Import handleApiResponse from utils
import { handleApiResponse } from '/js/utils.js';

export async function getSubjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/subjects`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        throw error;
    }
}


export async function createSubject(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/subjects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error creating subject:', error);
        throw error;
    }
}

export async function getSubject(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching subject:', error);
        throw error;
    }
}

export async function updateSubject(id, data) {
    try {
        const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error updating subject:', error);
        throw error;
    }
}

export async function deleteSubject(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/subjects/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        await handleApiResponse(response);
        return true;
    } catch (error) {
        console.error('Error deleting subject:', error);
        throw error;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = '/index.html';
} 