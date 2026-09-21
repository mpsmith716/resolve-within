
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { authClient, setBearerToken, clearAuthTokens } from "@/lib/auth";
import { extractSessionToken } from "@/lib/authHeaders";
import { authenticatedGet } from "@/utils/api";
import { safeGetItem, safeSetItem } from "@/utils/safeStorage";

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

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  userType?: string | null;
  notificationTime?: string | null;
  messageStreams?: string[] | null;
  first_name?: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<User | null>;
  refreshProfile: () => Promise<UserProfile | null>;
  needsOnboarding: () => Promise<boolean>;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (__DEV__) console.log("[Auth] Initializing AuthProvider, loading user session...");
    fetchUser();

    // Listen for deep links (e.g. from social auth redirects)
    const subscription = Linking.addEventListener("url", (event) => {
      if (__DEV__) console.log("[Auth] Deep link received");
      fetchUser();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const fetchUser = async (): Promise<User | null> => {
    try {
      setLoading(true);
      if (__DEV__) console.log("[Auth] Fetching user session from Better Auth...");
      const session = await authClient.getSession();

      if (session?.error) {
        console.warn("[Auth] getSession error:", session.error.message || session.error);
      }

      if (session?.data?.user) {
        if (__DEV__) console.log("[Auth] User session found");
        const nextUser = session.data.user as User;
        setUser(nextUser);

        // Sync token to SecureStore/localStorage for utils/api.ts + authClient Bearer
        const sessionToken = extractSessionToken(session.data) ?? session.data.session?.token;
        if (sessionToken) {
          if (__DEV__) console.log("[Auth] Syncing bearer token to storage");
          await setBearerToken(sessionToken);
        }

        // Load profile for onboarding / preferences (best-effort)
        try {
          const data = await authenticatedGet<UserProfile>("/api/user/profile");
          setProfile(data);
        } catch (profileError: any) {
          console.warn("[Auth] Profile fetch skipped:", profileError?.message || profileError);
        }

        return nextUser;
      }

      if (__DEV__) console.log("[Auth] No active session found");
      setUser(null);
      setProfile(null);
      await clearAuthTokens();
      return null;
    } catch (error: any) {
      console.error("[Auth] Failed to fetch user session:", error?.message || error);

      if (error?.message?.includes("401") || error?.status === 401) {
        if (__DEV__) console.log("[Auth] 401 detected, clearing tokens");
        setUser(null);
        setProfile(null);
        await clearAuthTokens();
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    try {
      if (__DEV__) console.log("[Auth] Fetching user profile...");
      const data = await authenticatedGet<UserProfile>("/api/user/profile");
      setProfile(data);
      if (data?.userType) {
        await safeSetItem("onboarding_completed", "true");
      }
      return data;
    } catch (error: any) {
      console.warn("[Auth] Failed to fetch profile:", error?.message || error);
      return null;
    }
  };

  const needsOnboarding = async (): Promise<boolean> => {
    const localDone = await safeGetItem("onboarding_completed");
    if (localDone === "true") {
      return false;
    }
    const current = profile ?? (await refreshProfile());
    if (current?.userType) {
      await safeSetItem("onboarding_completed", "true");
      return false;
    }
    return true;
  };

  const establishSessionAfterCredentialAuth = async (
    result: { data?: unknown; error?: { message?: string } | null },
    action: "sign-in" | "sign-up"
  ) => {
    if (result?.error) {
      throw new Error(result.error.message || `Unable to ${action}. Please try again.`);
    }

    const token = extractSessionToken(result?.data);
    if (token) {
      if (__DEV__) console.log(`[Auth] ${action} returned session token, saving for Bearer + API`);
      await setBearerToken(token);
    }

    const user = await fetchUser();
    if (!user) {
      // Do not proceed as logged-in if session/token establishment failed
      await clearAuthTokens();
      throw new Error(
        `Signed ${action === "sign-in" ? "in" : "up"} but session was not established. Please try again.`
      );
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      if (__DEV__) console.log("[Auth] Signing in with email");
      const result = await authClient.signIn.email({ email, password });
      await establishSessionAfterCredentialAuth(result, "sign-in");
    } catch (error: any) {
      console.error("[Auth] Email sign in failed:", error?.message || error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      if (__DEV__) console.log("[Auth] Signing up with email");
      const result = await authClient.signUp.email({
        email,
        password,
        name: name ?? "",
      });
      await establishSessionAfterCredentialAuth(result, "sign-up");
    } catch (error: any) {
      console.error("[Auth] Email sign up failed:", error?.message || error);
      throw error;
    }
  };

  const signInWithSocial = async (provider: "google" | "apple" | "github") => {
    try {
      if (__DEV__) console.log("[Auth] Signing in with", provider);
      
      if (Platform.OS === "web") {
        const token = await openOAuthPopup(provider);
        await setBearerToken(token);
        const user = await fetchUser();
        if (!user) {
          await clearAuthTokens();
          throw new Error("Signed in but session was not established. Please try again.");
        }
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

  const signOut = async () => {
    try {
      if (__DEV__) console.log("[Auth] Signing out...");
      await authClient.signOut();
    } catch (error: any) {
      console.warn("[Auth] Sign out API call failed (continuing):", error?.message || error);
    } finally {
      // Always clear local state, even if API call fails
      if (__DEV__) console.log("[Auth] Clearing local auth state");
      setUser(null);
      setProfile(null);
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
        profile,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        fetchUser,
        refreshProfile,
        needsOnboarding,
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
    // Log warning in development
    if (__DEV__) {
      console.warn(
        "[Auth] useAuth() called outside AuthProvider. " +
        "Returning safe defaults. " +
        "Make sure your app is wrapped with <AuthProvider>."
      );
    }
    
    // Return safe defaults instead of throwing
    return {
      user: null,
      profile: null,
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
        return null;
      },
      refreshProfile: async () => {
        console.error("[Auth] refreshProfile called outside AuthProvider");
        return null;
      },
      needsOnboarding: async () => false,
    };
  }
  
  return context;
}
