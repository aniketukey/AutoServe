const BASE_URL = 'http://localhost:8081/api';

/**
 * Validates the JWT token expiration.
 * @param {string} token 
 * @returns {boolean} true if valid, false if expired or invalid
 */
const isTokenValid = (token) => {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp > currentTime;
    } catch (e) {
        return false;
    }
};

/**
 * Generic API Fetch Helper
 * @param {string} endpoint - e.g., '/users/getUsers' or '/auth/login'
 * @param {string} method - 'GET', 'POST', 'PUT', 'DELETE'
 * @param {object} body - JSON payload (optional)
 * @param {boolean} requireAuth - Whether to send Authorization header (default: true)
 */
export const apiFetch = async (endpoint, method = 'GET', body = null, requireAuth = true) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (requireAuth) {
        let token = localStorage.getItem('token');
        if (token && token.startsWith('Bearer ')) {
            token = token.substring(7);
        }

        if (!token || !isTokenValid(token)) {
            // Optional: Handle token expiration here (e.g., redirect to login)
            console.warn('Token missing or expired');
            // We might still want to try the request or let the backend reject it
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        // Log status for debugging
        console.log(`API [${method}] ${endpoint} -> ${response.status}`);

        if (response.status === 401 || response.status === 403) {
            // Can add logic here to clear token and redirect if needed
            console.error('Unauthorized/Forbidden access');
        }

        return response; // Return the raw response so caller can handle .json(), .text(), or .ok checks
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};
