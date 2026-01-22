/**
 * API helper function for making requests to the backend
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {object|null} body - Request body (will be JSON stringified)
 * @param {string|null} token - JWT token for authentication
 * @returns {Promise<object>} Parsed JSON response
 */
export async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const baseURL = 'http://localhost:5000/api';
  const url = `${baseURL}${endpoint}`;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Attach Authorization header if token is provided
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  // Add body if provided
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  // Throw error for non-OK responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  // Return parsed JSON
  return await response.json();
}
