// Shared admin authentication utilities
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_AUTH_KEY = 'admin_authenticated';

export const AdminAuth = {
  // Save admin token to localStorage
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    }
  },

  // Get admin token from localStorage
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ADMIN_AUTH_KEY) === 'true' && !!localStorage.getItem(ADMIN_TOKEN_KEY);
    }
    return false;
  },

  // Clear authentication
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  },

  // Get headers with admin token for API calls
  getHeaders: (): HeadersInit => {
    const token = AdminAuth.getToken();
    return token ? { "x-admin-token": token } : {};
  }
};
