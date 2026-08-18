// Shared admin authentication utilities
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_AUTH_KEY = 'admin_authenticated';

export const AdminAuth = {
  // Verify the token against the server and only persist it when it is valid
  login: async (token: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.status === 401) {
        AdminAuth.logout();
        return { ok: false, error: 'Invalid admin token.' };
      }
      if (!res.ok) {
        // Keep the stored token: a 429 or a server blip says nothing about
        // whether the token is valid, and discarding it locks the admin out.
        const error = res.status === 429
          ? 'Too many attempts. Please wait a few minutes and try again.'
          : 'Unable to verify admin token.';
        return { ok: false, error };
      }
      AdminAuth.setToken(token);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Unable to reach the server. Please try again.' };
    }
  },

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
