import { login as loginUser } from '@/api/login';
import { getMe } from "@/api/user";
import { AuthContextType, User } from "@/models/auth";
import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";
import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { createContext, useContext, useEffect, useState } from "react";
import type { NavigateOptions } from "react-router-dom";
import { useHref, useNavigate } from "react-router-dom";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

// Create the context with a default value that matches AuthContextType
// We use 'null as any' initially because the context will be provided by AuthProvider
export const AuthContext = createContext<AuthContextType | null>(null);

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = new QueryClient();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // To handle initial cookie check

  useEffect(() => {
    const checkAuth = async () => {
      const authCookie = Cookies.get('tk');
      if (authCookie) {
        // If a token exists, try to fetch the user profile to validate it
        const userData = await getMe();
        if (userData) {
          setIsAuthenticated(true);
          setUser(userData);
        } else {
          // Token might be invalid or expired, clear it
          Cookies.remove('tk');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    try {
      setLoading(true); // Show loading state during login attempt

      const response = await loginUser(credentials.username, credentials.password);
      if (response.status !== 200) {
        const errorData = await response.data // Get error message from server
        console.error('Login failed:', errorData.message || response.statusText);
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return false;
      }

      setIsAuthenticated(true);
      setUser(await getMe()); // Set user data received from the server
      setLoading(false);
      navigate('/files')
      return true; // Login successful
    } catch (error) {
      console.error('Error during login:', error);
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return false; // Login failed due to network error or other exception
    }
  };

  const logout = () => {
    Cookies.remove('tk');
    setIsAuthenticated(false);
    setUser(null);
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider navigate={navigate} useHref={useHref}>
        <ToastProvider />
        <AuthContext.Provider value={contextValue}>
          {children}
        </AuthContext.Provider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}

// Custom hook to consume the AuthContext with type safety
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
