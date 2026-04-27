
import { safeGetJSON, safeSetJSON } from './safeStorage';

const FAVORITES_KEY = 'resolveWithinFavorites';

export interface Favorite {
  id: string;
  type: 'breathing' | 'grounding' | 'message';
  timestamp: number;
}

/**
 * Fetch all favorites from storage
 */
export async function fetchFavorites(): Promise<Favorite[]> {
  const favorites = await safeGetJSON<Favorite[]>(FAVORITES_KEY, []);
  console.log('Favorites: Loaded', favorites.length, 'favorites');
  return favorites;
}

/**
 * Toggle a favorite (add if not present, remove if present)
 */
export async function toggleFavorite(id: string, type: Favorite['type']): Promise<boolean> {
  try {
    const favorites = await fetchFavorites();
    const existingIndex = favorites.findIndex((fav) => fav.id === id);

    let newFavorites: Favorite[];
    let action: string;

    if (existingIndex >= 0) {
      // Remove favorite
      newFavorites = favorites.filter((fav) => fav.id !== id);
      action = 'removed';
    } else {
      // Add favorite
      newFavorites = [...favorites, { id, type, timestamp: Date.now() }];
      action = 'added';
    }

    const success = await safeSetJSON(FAVORITES_KEY, newFavorites);
    if (success) {
      console.log(`Favorites: Successfully ${action} favorite "${id}"`);
      return existingIndex < 0; // Return true if added, false if removed
    } else {
      console.warn(`Favorites: Failed to ${action} favorite "${id}", but continuing`);
      return existingIndex < 0;
    }
  } catch (error) {
    console.warn('Favorites: Error toggling favorite, continuing without save:', error);
    return false;
  }
}

/**
 * Check if an item is favorited
 */
export async function isFavorited(id: string): Promise<boolean> {
  const favorites = await fetchFavorites();
  return favorites.some((fav) => fav.id === id);
}

/**
 * Clear all favorites
 */
export async function clearFavorites(): Promise<boolean> {
  const success = await safeSetJSON(FAVORITES_KEY, []);
  if (success) {
    console.log('Favorites: Cleared all favorites');
  } else {
    console.warn('Favorites: Failed to clear favorites');
  }
  return success;
}

/**
 * Get favorites by type
 */
export async function getFavoritesByType(type: Favorite['type']): Promise<Favorite[]> {
  const favorites = await fetchFavorites();
  return favorites.filter((fav) => fav.type === type);
}
