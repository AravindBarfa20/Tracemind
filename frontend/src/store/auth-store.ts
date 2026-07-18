import { create } from 'zustand';
import type { User } from '@/types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize state from local storage securely
  const token = localStorage.getItem('tracemind_access_token');
  const refreshToken = localStorage.getItem('tracemind_refresh_token');
  const userStr = localStorage.getItem('tracemind_user');
  
  let user: User | null = null;
  try {
    if (userStr) user = JSON.parse(userStr);
  } catch {
    localStorage.removeItem('tracemind_user');
  }

  return {
    user,
    token,
    refreshToken,
    isAuthenticated: !!token,
    
    login: (accessToken, refresh, loggedUser) => {
      localStorage.setItem('tracemind_access_token', accessToken);
      localStorage.setItem('tracemind_refresh_token', refresh);
      localStorage.setItem('tracemind_user', JSON.stringify(loggedUser));
      set({
        token: accessToken,
        refreshToken: refresh,
        user: loggedUser,
        isAuthenticated: true
      });
    },
    
    logout: () => {
      localStorage.removeItem('tracemind_access_token');
      localStorage.removeItem('tracemind_refresh_token');
      localStorage.removeItem('tracemind_user');
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false
      });
    },
    
    updateUser: (updatedUser) => {
      localStorage.setItem('tracemind_user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  };
});
export default useAuthStore;
