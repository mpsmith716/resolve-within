
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { authClient, setBearerToken, clearAuthTokens } from "@/lib/auth";
import { useRouter } from "expo-router";

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
  isGuest: boolean;
continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const popupUrl = `${window.location.origin}/auth-popup?provider=${provider}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      popupUrl,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error("Failed to open popup. Please allow popups."));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success" && event.data?.token) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        resolve(event.data.token);
      } else if (event.data?.type === "oauth-error") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        reject(new Error(event.data.error || "OAuth failed"));
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Authentication cancelled"));
      }
    }, 500);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    console.log("[Auth] Initializing AuthProvider, loading user session...");
    fetchUser();

    // Listen for deep links (e.g. from social auth redirects)
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("[Auth] Deep link received", event.url);
      fetchUser();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      console.log("[Auth] Fetching user session from Better Auth...");
      const session = await authClient.getSession();
      
      if (session?.data?.user) {
        console.log("[Auth] User session found:", session.data.user.email);
        setUser(session.data.user as User);
        
        // Sync token to SecureStore/localStorage for utils/api.ts
        if (session.data.session?.token) {
          console.log("[Auth] Syncing bearer token to storage");
          await setBearerToken(session.data.session.token);
        }
      } else {
        console.log("[Auth] No active session found");
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error: any) {
      console.error("[Auth] Failed to fetch user session:", error?.message || error);
      
      // If we get a 401, clear tokens and redirect to auth
      if (error?.message?.includes("401") || error?.status === 401) {
        console.log("[Auth] 401 detected, clearing tokens and redirecting to auth");
        setUser(null);
        await clearAuthTokens();
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log("[Auth] Signing in with email:", email);
      const result = await authClient.signIn.email({ email, password });
      
      // Extract token from result if available
      if (result?.data?.session?.token) {
        console.log("[Auth] Login successful, saving token");
        await setBearerToken(result.data.session.token);
      }
      
      await fetchUser();
    } catch (error: any) {
      console.error("[Auth] Email sign in failed:", error?.message || error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      console.log("[Auth] Signing up with email:", email);
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });
      
      // Extract token from result if available
      if (result?.data?.session?.token) {
        console.log("[Auth] Signup successful, saving token");
        await setBearerToken(result.data.session.token);
      }
      
      await fetchUser();
    } catch (error: any) {
      console.error("[Auth] Email sign up failed:", error?.message || error);
      throw error;
    }
  };

  const signInWithSocial = async (provider: "google" | "apple" | "github") => {
    try {
      console.log("[Auth] Signing in with", provider);
      
      if (Platform.OS === "web") {
        const token = await openOAuthPopup(provider);
        await setBearerToken(token);
        await fetchUser();
      } else {
        // Native: Use expo-linking to generate a proper deep link
        const callbackURL = Linking.createURL("auth-callback");
        await authClient.signIn.social({
          provider,
          callbackURL,
        });
        
        // The redirect will reload the app, fetchUser will be called on mount
        await fetchUser();
      }
    } catch (error: any) {
      console.error(`[Auth] ${provider} sign in failed:`, error?.message || error);
      throw error;
    }
  };

  const signInWithGoogle = () => signInWithSocial("google");
  const signInWithApple = () => signInWithSocial("apple");
  const signInWithGitHub = () => signInWithSocial("github");
  const continueAsGuest = () => {
  console.log("[Auth] Continuing as guest");
  setIsGuest(true);
  setUser(null);
  setLoading(false);
};

  const signOut = async () => {
    try {
      console.log("[Auth] Signing out...");
      await authClient.signOut();
    } catch (error: any) {
      console.warn("[Auth] Sign out API call failed (continuing):", error?.message || error);
    } finally {
      // Always clear local state, even if API call fails
      console.log("[Auth] Clearing local auth state");
      setUser(null);
      setIsGuest(false);
      try {
        await clearAuthTokens();
      } catch (tokenError: any) {
        console.warn("[Auth] Failed to clear auth tokens:", tokenError?.message || tokenError);
      }
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
        isGuest,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Safe useAuth hook
 * NEVER hard-throws if used outside AuthProvider
 * Returns safe defaults and logs a warning instead
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    if (__DEV__) {
      console.warn(
        "[Auth] useAuth() called outside AuthProvider. " +
        "Returning safe defaults. " +
        "Make sure your app is wrapped with <AuthProvider>."
      );
    }

    return {
      user: null,
      loading: false,
      signInWithEmail: async () => {
        console.error("[Auth] signInWithEmail called outside AuthProvider");
      },
      signUpWithEmail: async () => {
        console.error("[Auth] signUpWithEmail called outside AuthProvider");
      },
      signInWithGoogle: async () => {
        console.error("[Auth] signInWithGoogle called outside AuthProvider");
      },
      signInWithApple: async () => {
        console.error("[Auth] signInWithApple called outside AuthProvider");
      },
      signInWithGitHub: async () => {
        console.error("[Auth] signInWithGitHub called outside AuthProvider");
      },
      signOut: async () => {
        console.error("[Auth] signOut called outside AuthProvider");
      },
      fetchUser: async () => {
        console.error("[Auth] fetchUser called outside AuthProvider");
      },
      isGuest: false,
      continueAsGuest: () => {
        console.error("[Auth] continueAsGuest called outside AuthProvider");
      },
    };
  }

  return context;
}