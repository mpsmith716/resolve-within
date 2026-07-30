import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import {
  authClient,
  setBearerToken,
  clearAuthTokens,
} from "@/lib/auth";

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
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    name?: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
  isGuest: boolean;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== "web") {
      reject(
        new Error(
          "OAuth popup authentication is only available on web."
        )
      );
      return;
    }

    const popupUrl =
      `${window.location.origin}/auth-popup?provider=${provider}`;

    const width = 500;
    const height = 600;
    const left =
      window.screenX + (window.outerWidth - width) / 2;
    const top =
      window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      popupUrl,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(
        new Error(
          "Failed to open popup. Please allow popups."
        )
      );
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.type === "oauth-success" &&
        event.data?.token
      ) {
        window.removeEventListener(
          "message",
          handleMessage
        );
        clearInterval(checkClosed);
        resolve(event.data.token);
        return;
      }

      if (event.data?.type === "oauth-error") {
        window.removeEventListener(
          "message",
          handleMessage
        );
        clearInterval(checkClosed);

        reject(
          new Error(
            event.data.error || "OAuth authentication failed."
          )
        );
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener(
          "message",
          handleMessage
        );
        reject(new Error("Authentication cancelled."));
      }
    }, 500);
  });
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const fetchUser = async () => {
    try {
      setLoading(true);

      console.log(
        "[Auth] Fetching user session from Better Auth..."
      );

      const session = await authClient.getSession();

      console.log("[Auth] Session response:", {
        hasData: Boolean(session?.data),
        hasUser: Boolean(session?.data?.user),
        error: session?.error,
      });

      if (session?.error) {
        throw new Error(
          session.error.message ||
            "Unable to retrieve the current session."
        );
      }

      if (session?.data?.user) {
        console.log(
          "[Auth] User session found:",
          session.data.user.email
        );

        setUser(session.data.user as User);
        setIsGuest(false);

        const token = session.data.session?.token;

        if (token) {
          console.log(
            "[Auth] Syncing bearer token to storage"
          );
          await setBearerToken(token);
        }

        return;
      }

      console.log("[Auth] No active session found");

      setUser(null);
      await clearAuthTokens();
    } catch (error: any) {
      console.error(
        "[Auth] Failed to fetch user session:",
        error?.message || error
      );

      setUser(null);

      if (
        error?.message?.includes("401") ||
        error?.status === 401
      ) {
        console.log(
          "[Auth] 401 detected, clearing stored tokens"
        );

        await clearAuthTokens();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(
      "[Auth] Initializing AuthProvider, loading user session..."
    );

    fetchUser();

    const subscription = Linking.addEventListener(
      "url",
      async (event) => {
        console.log(
          "[Auth] Deep link received:",
          event.url
        );

        await fetchUser();
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const signInWithEmail = async (
    email: string,
    password: string
  ) => {
    try {
      setLoading(true);

      console.log(
        "[Auth] Signing in with email:",
        email
      );

      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      console.log("[Auth] Sign-in response:", {
        hasData: Boolean(result?.data),
        hasUser: Boolean(result?.data?.user),
        hasSession: Boolean(result?.data?.session),
        error: result?.error,
      });

      if (result?.error) {
        throw new Error(
          result.error.message ||
            "Unable to sign in with that email and password."
        );
      }

      const token = result?.data?.session?.token;

      if (token) {
        console.log(
          "[Auth] Login successful, saving bearer token"
        );

        await setBearerToken(token);
      }

      setIsGuest(false);

      await fetchUser();
    } catch (error: any) {
      console.error(
        "[Auth] Email sign in failed:",
        error?.message || error
      );

      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    name?: string
  ) => {
    try {
      setLoading(true);

      console.log(
        "[Auth] Signing up with email:",
        email
      );

      const trimmedEmail = email.trim();
      const resolvedName =
        name?.trim() ||
        trimmedEmail.split("@")[0] ||
        "Resolve Within User";

      const result = await authClient.signUp.email({
        email: trimmedEmail,
        password,
        name: resolvedName,
      });

      console.log("[Auth] Sign-up response:", {
        hasData: Boolean(result?.data),
        hasUser: Boolean(result?.data?.user),
        hasSession: Boolean(result?.data?.session),
        error: result?.error,
      });

      if (result?.error) {
        throw new Error(
          result.error.message ||
            "Unable to create the account."
        );
      }

      const token = result?.data?.session?.token;

      if (token) {
        console.log(
          "[Auth] Signup successful, saving bearer token"
        );

        await setBearerToken(token);
      }

      setIsGuest(false);

      await fetchUser();
    } catch (error: any) {
      console.error(
        "[Auth] Email sign up failed:",
        error?.message || error
      );

      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithSocial = async (
    provider: "google" | "apple" | "github"
  ) => {
    try {
      setLoading(true);

      console.log(
        `[Auth] Signing in with ${provider}`
      );

      if (Platform.OS === "web") {
        const token = await openOAuthPopup(provider);

        await setBearerToken(token);
        setIsGuest(false);
        await fetchUser();

        return;
      }

      const callbackURL =
        Linking.createURL("auth-callback");

      const result =
        await authClient.signIn.social({
          provider,
          callbackURL,
        });

      if (result?.error) {
        throw new Error(
          result.error.message ||
            `${provider} authentication failed.`
        );
      }

      setIsGuest(false);

      /*
       * The OAuth provider may leave the app temporarily.
       * The deep-link listener above calls fetchUser()
       * when the user returns.
       */
    } catch (error: any) {
      console.error(
        `[Auth] ${provider} sign in failed:`,
        error?.message || error
      );

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = () =>
    signInWithSocial("google");

  const signInWithApple = () =>
    signInWithSocial("apple");

  const signInWithGitHub = () =>
    signInWithSocial("github");

  const continueAsGuest = () => {
    console.log("[Auth] Continuing as guest");

    setIsGuest(true);
    setUser(null);
    setLoading(false);
  };

  const signOut = async () => {
    try {
      setLoading(true);

      console.log("[Auth] Signing out...");

      const result = await authClient.signOut();

      if (result?.error) {
        console.warn(
          "[Auth] Sign out API returned an error:",
          result.error.message
        );
      }
    } catch (error: any) {
      console.warn(
        "[Auth] Sign out API call failed, continuing:",
        error?.message || error
      );
    } finally {
      console.log(
        "[Auth] Clearing local authentication state"
      );

      setUser(null);
      setIsGuest(false);

      try {
        await clearAuthTokens();
      } catch (tokenError: any) {
        console.warn(
          "[Auth] Failed to clear authentication tokens:",
          tokenError?.message || tokenError
        );
      }

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
        isGuest,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    if (__DEV__) {
      console.warn(
        "[Auth] useAuth() called outside AuthProvider. " +
          "Returning safe defaults. Make sure the app " +
          "is wrapped with <AuthProvider>."
      );
    }

    return {
      user: null,
      loading: false,

      signInWithEmail: async () => {
        console.error(
          "[Auth] signInWithEmail called outside AuthProvider"
        );
      },

      signUpWithEmail: async () => {
        console.error(
          "[Auth] signUpWithEmail called outside AuthProvider"
        );
      },

      signInWithGoogle: async () => {
        console.error(
          "[Auth] signInWithGoogle called outside AuthProvider"
        );
      },

      signInWithApple: async () => {
        console.error(
          "[Auth] signInWithApple called outside AuthProvider"
        );
      },

      signInWithGitHub: async () => {
        console.error(
          "[Auth] signInWithGitHub called outside AuthProvider"
        );
      },

      signOut: async () => {
        console.error(
          "[Auth] signOut called outside AuthProvider"
        );
      },

      fetchUser: async () => {
        console.error(
          "[Auth] fetchUser called outside AuthProvider"
        );
      },

      isGuest: false,

      continueAsGuest: () => {
        console.error(
          "[Auth] continueAsGuest called outside AuthProvider"
        );
      },
    };
  }

  return context;
}