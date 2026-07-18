const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api/v1';

class APIError extends Error {
  status: number;
  details: any;
  
  constructor(message: string, status: number, details: any = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/${path.replace(/^\//, '')}`;
  
  // Retrieve token from local storage
  const token = localStorage.getItem('tracemind_access_token');
  
  const headers = new Headers(options.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (!path.includes('/auth/login')) {
      // Session expired: clear credentials and redirect to login page
      localStorage.removeItem('tracemind_access_token');
      localStorage.removeItem('tracemind_refresh_token');
      localStorage.removeItem('tracemind_user');
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new APIError('Session expired. Please log in again.', 401);
    }
  }

  if (!response.ok) {
    let errorDetail = 'An error occurred while calling the API';
    let details = null;
    
    try {
      const data = await response.json();
      errorDetail = data.error?.message || errorDetail;
      details = data.error?.details || null;
    } catch {
      // Non-JSON response error fallback
      errorDetail = response.statusText || errorDetail;
    }
    
    throw new APIError(errorDetail, response.status, details);
  }

  // Parse JSON response. Handle empty body (like 204 or DELETE returning none)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  
  return {} as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestInit) => 
    request<T>(path, { ...options, method: 'GET' }),
    
  post: <T>(path: string, body?: any, options?: RequestInit) => 
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  put: <T>(path: string, body?: any, options?: RequestInit) => 
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  delete: <T>(path: string, options?: RequestInit) => 
    request<T>(path, { ...options, method: 'DELETE' }),
};
export default apiClient;
