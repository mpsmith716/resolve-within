/** Plain-language message for a failed block / unblock / list request. */
export function blockErrorMessage(error: unknown): string {
  const message = typeof (error as any)?.message === 'string' ? (error as any).message : '';
  if (/API error: 400/.test(message) && /block yourself/i.test(message)) {
    return "You can't block yourself.";
  }
  if (/API error: 404/.test(message)) {
    return 'That post is no longer available.';
  }
  if (/API error: 503/.test(message)) {
    return "Blocking isn't available right now. Please try again later.";
  }
  if (/Authentication token not found|API error: 401/.test(message)) {
    return 'Please sign in again and try once more.';
  }
  return 'Something went wrong. Check your connection and try again.';
}

/** Remove one post from a list (used right after its author is blocked). */
export function withoutPost<T extends { id: string }>(posts: T[], postId: string): T[] {
  return posts.filter((post) => post.id !== postId);
}
