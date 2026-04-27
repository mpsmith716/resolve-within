import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { authClient, setBearerToken, clearAuthTokens } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  user_metadata?: {
    first_name?: string;
    name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function withTimeout<T>(promise: Promise<T>, ms = 20000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Auth session request timed out')), ms)
    ),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('[Auth] Fetching user session from Better Auth...');

      const session = await withTimeout(authClient.getSession(), 20000);

      if (session?.data?.user) {
        console.log('[Auth] User session found:', session.data.user.email);
        setUser(session.data.user as User);

        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }

        return;
      }

      console.log('[Auth] No active session found');
      setUser(null);
      await clearAuthTokens();
    } catch (error: any) {
      const message = error?.message || String(error);
      console.error('[Auth] Failed to fetch user session:', message);

      setUser(null);

      if (
        message.includes('expires') ||
        message.includes('401') ||
        message.includes('timed out') ||
        error?.status === 401
      ) {
        await clearAuthTokens();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[Auth] Initializing AuthProvider...');
    fetchUser();

    const subscription = Linking.addEventListener('url', (event) => {
      console.log('[Auth] Deep link received:', event.url);

      setTimeout(() => {
        fetchUser();
      }, 2500);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const result = await authClient.signIn.email({ email, password });

    if (result?.data?.session?.token) {
      await setBearerToken(result.data.session.token);
    }

    await fetchUser();
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    const result = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (result?.data?.session?.token) {
      await setBearerToken(result.data.session.token);
    }

    await fetchUser();
  };

  // 🔥 FIXED SOCIAL LOGIN
  const signInWithSocial = async (provider: 'google' | 'apple' | 'github') => {
    try {
      console.log('[Auth] Starting', provider, 'login...');

      const callbackURL = Linking.createURL('auth-callback');
      console.log('[Auth] OAuth callbackURL:', callbackURL);

      await authClient.signIn.social({
        provider,
        callbackURL,
      });
    } catch (error: any) {
      console.error(`[Auth] ${provider} sign in failed:`, error?.message || error);
      throw error;
    }
  };

  const signInWithGoogle = () => signInWithSocial('google');
  const signInWithApple = () => signInWithSocial('apple');
  const signInWithGitHub = () => signInWithSocial('github');

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (error: any) {
      console.warn('[Auth] Sign out failed:', error?.message || error);
    } finally {
      setUser(null);
      await clearAuthTokens();
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}