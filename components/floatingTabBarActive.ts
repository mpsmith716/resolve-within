/**
 * Pure active-tab resolver for FloatingTabBar.
 * Journal is a query-param mode under (home) (`?tab=journal`), so pathname alone
 * cannot distinguish Home vs Journal — searchParams.tab must win.
 */

export type TabMatchInput = {
  name: string;
  /** Route href string; query string is ignored for pathname matching. */
  route: string;
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

/**
 * Returns the index of the active tab, or 0 when nothing matches.
 */
export function resolveActiveTabIndex(
  tabs: TabMatchInput[],
  pathname: string,
  searchParams: { tab?: string | string[] } = {}
): number {
  const tabParam = firstParam(searchParams.tab);
  const path = normalizePath(pathname);

  // Journal selected via query param — must not leave Home highlighted.
  if (tabParam === "journal") {
    const journalIdx = tabs.findIndex((t) => t.name === "journal");
    if (journalIdx >= 0) return journalIdx;
  }

  let bestMatch = -1;
  let bestMatchScore = 0;

  tabs.forEach((tab, index) => {
    const routePath = normalizePath(String(tab.route));
    let score = 0;

    if (tab.name === "journal") {
      // Dedicated journal path (if ever introduced); query case handled above.
      if (path.includes("journal") && !path.includes("(home)")) {
        score = 90;
      }
    } else if (tab.name === "(home)") {
      const onHomeGroup =
        path === "/" ||
        path.includes("(home)") ||
        path.endsWith("/home") ||
        path === routePath;
      // Home is inactive while Journal (or community) query mode is active.
      if (
        onHomeGroup &&
        tabParam !== "journal" &&
        tabParam !== "community"
      ) {
        score = 85;
      }
    } else if (path === routePath) {
      score = 100;
    } else if (routePath !== "/" && path.startsWith(routePath)) {
      score = 80;
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
