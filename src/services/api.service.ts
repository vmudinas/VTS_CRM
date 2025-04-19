/**
 * Base API Service
 * Handles common API functionality like authentication and HTTP requests
 */

// API base URL - use environment variable or fallback
const API_URL = process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL.endsWith('/api') 
    ? process.env.REACT_APP_API_URL 
    : `${process.env.REACT_APP_API_URL}/api`
  : process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:4000/api';

/**
 * API Service class for handling HTTP requests
 */
class ApiService {
  private token: string | null = null;

  /**
   * Set the authentication token
   * @param token JWT token
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Get the current authentication token
   * @returns The current token or null if not authenticated
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Check if the user is authenticated
   * @returns True if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Get common headers for API requests
   * @param includeContentType Whether to include Content-Type header
   * @returns Headers object
   */
  getHeaders(includeContentType = true): HeadersInit {
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  }

  /**
   * Make a GET request to the API
   * @param endpoint API endpoint
   * @returns Promise with the response data
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * Make a POST request to the API
   * @param endpoint API endpoint
   * @param data Request body data
   * @returns Promise with the response data
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * Make a PUT request to the API
   * @param endpoint API endpoint
   * @param data Request body data
   * @returns Promise with the response data
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * Make a DELETE request to the API
   * @param endpoint API endpoint
   * @returns Promise with the response data
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * Upload a file with form data
   * @param endpoint API endpoint
   * @param formData FormData object with file and other data
   * @returns Promise with the response data
   */
  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(false), // Don't include Content-Type, browser will set it
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * Update a file with form data
   * @param endpoint API endpoint
   * @param formData FormData object with file and other data
   * @returns Promise with the response data
   */
  async updateWithFile<T>(endpoint: string, formData: FormData): Promise<T> {
    try {
      console.log(`Updating with file to ${endpoint}`);
      
      // Log FormData contents (for debugging)
      console.log('FormData contents:');
      for (const pair of (formData as any).entries()) {
        if (pair[0] === 'image' && pair[1] instanceof File) {
          console.log(`${pair[0]}: [File] ${pair[1].name}, type: ${pair[1].type}, size: ${pair[1].size} bytes`);
        } else {
          console.log(`${pair[0]}: ${pair[1]}`);
        }
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(false), // Don't include Content-Type, browser will set it
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API error: ${response.status}`;
        
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If not JSON, use the raw text
          if (errorText) {
            errorMessage = `API error: ${errorText}`;
          }
        }
        
        console.error(`Error in updateWithFile: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Update successful, received data:', data);
      return data;
    } catch (error) {
      console.error('Error in updateWithFile:', error);
      throw error;
    }
  }

  /**
   * Authenticate user and get token
   * @param username Username
   * @param password Password
   * @returns Promise with the authentication result
   */
  async login(username: string, password: string): Promise<{ token: string; user: any }> {
    // Note: AuthController is routed under /api/auth/login
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }
    
    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  /**
   * Log out the user
   */
  logout(): void {
    this.setToken(null);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
