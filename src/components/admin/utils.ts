// Utility functions for admin dashboard operations

export const createAuthHeaders = (token?: string | null): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const authHeaders = createAuthHeaders(token);
  
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
};

export const handleApiError = (error: any, operation: string) => {
  console.error(`Error ${operation}:`, error);
  alert(`Error ${operation}: ${error.message}`);
};
