// Base URL for API requests
const BASE_URL = 'http://localhost:3001';

// API request helper function
const apiRequest = async(url, options = {}) => {
    try {
        // Simplified options
        const finalOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        };

        console.log('Making request:', {
            url,
            method: finalOptions.method,
            body: finalOptions.body
        });

        const response = await fetch(url, finalOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

// Login function
export const login = async(credentials) => {
    return apiRequest(`${BASE_URL}/auth/login`, {
        method: 'POST',
        body: credentials
    });
};

// Test function
export const testConnection = async() => {
    try {
        const response = await apiRequest(`${BASE_URL}/test`);
        console.log('Test response:', response);
        return response;
    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    }
};