"use client";

import type { ThemeProviderProps } from "next-themes";

import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createContext, Dispatch, SetStateAction, useContext, useMemo, useState } from "react";
import { User } from "@/models/user";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

// Define the interface for the User Context's value
interface UserContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
}

// 1. Create the User Context
// This will hold the user state and the function to update it.
// We provide a default value that matches IUserContextType, though it will be overridden by the Provider.
const UserContext = createContext<UserContextType | null>(null);

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();
  const queryClient = new QueryClient();

  // Initialize user state with a default null value (no user logged in),
  // explicitly typing it as IUser or null.
  const [user, setUser] = useState<User | null>(null);
  // Memoize the context value to prevent unnecessary re-renders of consumers.
  // The value will only change if the 'user' state changes.
  const contextValue = useMemo<UserContextType>(() => ({ user, setUser }), [user]);

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>
          <UserContext.Provider value={contextValue}>
            {children}
          </UserContext.Provider>
          <ReactQueryDevtools initialIsOpen={false} />
        </NextThemesProvider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}

/**
 * 3. Custom Hook to consume the User Context
 * This hook makes it easy for any component to access the user state
 * and update function without directly importing useContext and UserContext.
 * @returns {{user: User | null, setUser: Dispatch<SetStateAction<User | null>>}}
 * An object containing the current user state and the setUser function.
 */
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === null) {
    // This error indicates that useUser was called outside of a UserProvider.
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
