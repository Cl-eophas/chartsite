const getBaseUrl = () => {
  return 'http://localhost:3001';
};

const BASE_URL = getBaseUrl();

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = getAuthToken();
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('token');
        throw new Error('Unauthorized access. Please login again.');
      }
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.msg || error.message || 'Something went wrong');
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// File upload request
export const uploadRequest = async (endpoint, formData, options = {}) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      credentials: 'include',
      mode: 'cors'
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('token');
        throw new Error('Unauthorized access. Please login again.');
      }
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Something went wrong');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload Request Error:', error);
    throw error;
  }
};
