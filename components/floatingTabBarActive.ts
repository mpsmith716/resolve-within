/**
 * Pure active-tab resolver for FloatingTabBar.
 *
 * Journal is a query-param mode under (home) (`?tab=journal`), so pathname alone
 * cannot distinguish Home vs Journal. On physical Android, Expo Router often does
 * not surface that query to the sibling FloatingTabBar via useGlobalSearchParams.
 * Callers should pass `homeTabMode` from FloatingTabActiveContext as the reliable
 * native representation of Home vs Journal.
 */

export type TabMatchInput = {
  name: string;
  /** Route href string; query string is ignored for pathname matching. */
  route: string;
};

export type HomeTabMode = "home" | "journal" | "community";

export type ResolveActiveTabOptions = {
  /**
   * Authoritative home-group mode from shared context (set on tab press /
   * home screen). Wins when searchParams.tab is missing (Android native).
   */
  homeTabMode?: HomeTabMode | null;
};

function normalizePath(path: string): string {
  if (!path) return "/";
  const noQuery = path.split("?")[0] || "/";
  if (noQuery.length > 1 && noQuery.endsWith("/")) {
    return noQuery.slice(0, -1);
  }
  return noQuery;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** True when pathname is the home group (including Android stripped forms). */
export function isHomeGroupPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  // Native Expo Router often strips groups → "/" or "/index"
  if (path === "/" || path === "/index") return true;
  if (path.includes("(home)")) return true;
  if (path.endsWith("/home") || path === "/home") return true;
  // Stripped tabs home: "/(tabs)" or "/tabs" alone are ambiguous; treat as home
  // only when not clearly another tab route.
  if (path === "/(tabs)" || path === "/(tabs)/(home)" || path === "/(tabs)/(home)/index") {
    return true;
  }
  return false;
}

/**
 * Returns the index of the active tab, or 0 when nothing matches.
 */
export function resolveActiveTabIndex(
  tabs: TabMatchInput[],
  pathname: string,
  searchParams: { tab?: string | string[] } = {},
  options: ResolveActiveTabOptions = {}
): number {
  const path = normalizePath(pathname);
  const onHome = isHomeGroupPath(pathname);

  // Explicit query wins when present; else shared context (Android-safe).
  const tabFromParams = firstParam(searchParams.tab);
  const tabParam =
    tabFromParams ??
    (onHome && options.homeTabMode ? options.homeTabMode : undefined);

  // Journal selected via query/context — must not leave Home highlighted.
  // Only while still on the home group (stale context must not win on Veterans).
  if (tabParam === "journal" && onHome) {
    const journalIdx = tabs.findIndex((t) => t.name === "journal");
    if (journalIdx >= 0) return journalIdx;
  }

  let bestMatch = -1;
  let bestMatchScore = 0;

  tabs.forEach((tab, index) => {
    const routePath = normalizePath(String(tab.route));
    let score = 0;

    if (tab.name === "journal") {
      // Dedicated journal path (if ever introduced); query/context case above.
      if (path.includes("journal") && !path.includes("(home)")) {
        score = 90;
      }
    } else if (tab.name === "(home)") {
      // Home is inactive while Journal (or community) mode is active.
      if (
        onHome &&
        tabParam !== "journal" &&
        tabParam !== "community"
      ) {
        score = 85;
      }
    } else if (path === routePath) {
      score = 100;
    } else if (routePath !== "/" && path.startsWith(routePath)) {
      score = 80;
    } else if (
      // Android often strips groups: "/veterans" vs "/(tabs)/veterans"
      path === `/${tab.name}` ||
      path.endsWith(`/${tab.name}`)
    ) {
      score = 95;
    } else if (pathname.includes(tab.name)) {
      score = 60;
    }

    if (score > bestMatchScore) {
      bestMatchScore = score;
      bestMatch = index;
    }
  });

  return bestMatch >= 0 ? bestMatch : 0;
}
