/**
 * API utility functions
 * Centralized API base URL configuration
 */

const getApiBaseUrl = (): string => {
  // Priority 1: Use environment variable if set (set during build)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Priority 2: Use relative /api path (works in both dev and prod)
  // In development, Vite proxy will forward /api to http://localhost:3000
  // In production, the web server (Nginx) will proxy /api to the backend
  // Always use relative paths so the web server can handle the proxying
  return '/api';
};

/**
 * Get the full API URL for a given endpoint
 */
export const apiUrl = (endpoint: string): string => {
  const base = getApiBaseUrl();
  
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // If endpoint already starts with 'api/', use it as-is (it's already a full path)
  // Otherwise, prepend the base
  if (cleanEndpoint.startsWith('api/')) {
    // Endpoint already includes 'api/' prefix, use it directly
    return `/${cleanEndpoint}`;
  }
  
  // Combine base with endpoint
  return `${base}/${cleanEndpoint}`;
};

/**
 * Fetch wrapper that automatically uses the correct API base URL
 */
export const apiFetch = async (
  endpoint: string,
  options?: RequestInit
): Promise<Response> => {
  const url = apiUrl(endpoint);
  
  // Debug log in development
  if (!import.meta.env.PROD) {
    console.log(`[API] Fetching: ${url} (endpoint: ${endpoint})`);
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Always include credentials for cookies
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // 401 is expected for auth check endpoint when not logged in
    // This is normal behavior, not an error
    if (response.status === 401 && endpoint.includes('users/me')) {
      // Return the response - the calling code will handle it
      return response;
    }

    return response;
  } catch (error) {
    // Only log network errors, not 401s
    if (!(error instanceof TypeError && error.message.includes('fetch'))) {
      console.error('API fetch error:', error);
    }
    throw error;
  }
};

