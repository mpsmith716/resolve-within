import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Shared home-group mode for FloatingTabBar highlighting.
 *
 * Journal is not a real stack route — it is `/(tabs)/(home)/?tab=journal`.
 * On physical Android, Expo Router often does not expose that query to the
 * sibling FloatingTabBar via useGlobalSearchParams, so pathname alone leaves
 * Home yellow. This context is set on Journal/Home press (and synced from the
 * home screen) so the tab bar can reflect the real UI mode.
 */
export type HomeTabMode = "home" | "journal" | "community";

type FloatingTabActiveContextValue = {
  homeTabMode: HomeTabMode | null;
  setHomeTabMode: (mode: HomeTabMode | null) => void;
};

const FloatingTabActiveContext =
  createContext<FloatingTabActiveContextValue | null>(null);

export function FloatingTabActiveProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [homeTabMode, setHomeTabModeState] = useState<HomeTabMode | null>(null);

  const setHomeTabMode = useCallback((mode: HomeTabMode | null) => {
    setHomeTabModeState(mode);
  }, []);

  const value = useMemo(
    () => ({ homeTabMode, setHomeTabMode }),
    [homeTabMode, setHomeTabMode]
  );

  return (
    <FloatingTabActiveContext.Provider value={value}>
      {children}
    </FloatingTabActiveContext.Provider>
  );
}

export function useFloatingTabActive(): FloatingTabActiveContextValue {
  const ctx = useContext(FloatingTabActiveContext);
  if (!ctx) {
    throw new Error(
      "useFloatingTabActive must be used within FloatingTabActiveProvider"
    );
  }
  return ctx;
}

/** Soft hook for optional use outside provider (tests / non-tab screens). */
export function useFloatingTabActiveOptional(): FloatingTabActiveContextValue | null {
  return useContext(FloatingTabActiveContext);
}
