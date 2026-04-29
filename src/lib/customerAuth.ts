import { CustomerProfile } from '../types';

const TOKEN_KEY = 'floricultura_customer_token';
const USER_KEY = 'floricultura_customer_user';

function emitChange() {
  window.dispatchEvent(new Event('customer-auth-change'));
}

export const customerAuth = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): CustomerProfile | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CustomerProfile;
    } catch {
      return null;
    }
  },

  setSession(token: string, user: CustomerProfile) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    emitChange();
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    emitChange();
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};