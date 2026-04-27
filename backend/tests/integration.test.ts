import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus, connectWebSocket, connectAuthenticatedWebSocket, waitForMessage } from "./helpers";

describe("API Integration Tests", () => {
  // Shared state for chaining tests
  let authToken: string;
  let userId: string;
  let journalEntryId: string;
  let communityPostId: string;
  let spotlightNominationId: string;
  let postIdForAdminTest: string;
  let breathingSessionId: string;

  test("Server is running - health check", async () => {
    const res = await api("/api/auth/ok");
    await expectStatus(res, 200);
  });

  // ============ Auth & User Setup ============
  test("Sign up test user for authenticated tests", async () => {
    const { token, user } = await signUpTestUser();
    authToken = token;
    userId = user.id;
    expect(authToken).toBeDefined();
    expect(userId).toBeDefined();
  });

  test("Get user profile", async () => {
    const res = await authenticatedApi("/api/user/profile", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.id).toBe(userId);
    expect(data.email).toBeDefined();
    expect(data.name).toBeDefined();
  });

  test("Update user preferences", async () => {
    const res = await authenticatedApi("/api/user/preferences", authToken, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userType: "veteran",
        notificationTime: "09:00",
        messageStreams: ["mental_health", "veteran"],
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.userType).toBe("veteran");
    expect(data.notificationTime).toBe("09:00");
  });

  test("Get disclaimer status", async () => {
    const res = await authenticatedApi("/api/user/disclaimer-status", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.accepted).toBeDefined();
    if (data.acceptedAt) {
      expect(typeof data.acceptedAt).toBe("string");
    }
  });

  test("Accept crisis disclaimer", async () => {
    const res = await authenticatedApi("/api/user/disclaimer-accept", authToken, {
      method: "POST",
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.acceptedAt).toBeDefined();
  });

  test("Get disclaimer status - after acceptance", async () => {
    const res = await authenticatedApi("/api/user/disclaimer-status", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.accepted).toBe(true);
    expect(data.acceptedAt).toBeDefined();
  });

  // ============ Journal Tests ============
  test("Create journal entry", async () => {
    const res = await authenticatedApi("/api/journal", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood: "light",
        content: "Had a good day today.",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.mood).toBe("light");
    expect(data.content).toBe("Had a good day today.");
    expect(data.userId).toBe(userId);
    expect(data.createdAt).toBeDefined();
    journalEntryId = data.id;
  });

  test("Create journal entry with different moods", async () => {
    const moods = ["cloudy", "onEdge", "numb", "heavy"];
    for (const mood of moods) {
      const res = await authenticatedApi("/api/journal", authToken, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood }),
      });
      await expectStatus(res, 201);
    }
  });

  test("Get journal entries", async () => {
    const res = await authenticatedApi("/api/journal", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].id).toBeDefined();
    expect(data[0].mood).toBeDefined();
  });

  test("Get journal entries with limit and offset", async () => {
    const res = await authenticatedApi("/api/journal?limit=2&offset=1", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("Get mood trends", async () => {
    const res = await authenticatedApi("/api/journal/trends", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.moods).toBeDefined();
    expect(data.streak).toBeDefined();
    expect(data.totalEntries).toBeGreaterThan(0);
  });

  test("Export journal entries", async () => {
    const res = await authenticatedApi("/api/journal/export", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("Delete journal entry", async () => {
    const res = await authenticatedApi(`/api/journal/${journalEntryId}`, authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test("Delete journal entry - 404 for nonexistent entry", async () => {
    const res = await authenticatedApi("/api/journal/00000000-0000-0000-0000-000000000000", authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 404);
  });

  // ============ Community Tests ============
  test("Create community post - veteran", async () => {
    const res = await authenticatedApi("/api/community/veteran", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Grateful for this community of veterans.",
        isAnonymous: true,
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.content).toBe("Grateful for this community of veterans.");
    expect(data.isAnonymous).toBe(true);
    expect(data.likeCount).toBe(0);
    expect(data.encourageCount).toBe(0);
    communityPostId = data.id;
  });

  test("Create community post - healing_together", async () => {
    const res = await authenticatedApi("/api/community/healing_together", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Healing is a journey we share together.",
        isAnonymous: false,
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.isAnonymous).toBe(false);
  });

  test("Get community posts - veteran", async () => {
    const res = await authenticatedApi("/api/community/veteran", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].id).toBeDefined();
    expect(data[0].content).toBeDefined();
  });

  test("Get community posts with pagination", async () => {
    const res = await authenticatedApi("/api/community/healing_together?limit=5&offset=0", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("Interact with post - like", async () => {
    const res = await authenticatedApi(`/api/community/posts/${communityPostId}/interact`, authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "like" }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.id).toBe(communityPostId);
    expect(data.likeCount).toBeGreaterThanOrEqual(0);
  });

  test("Interact with post - encourage", async () => {
    const res = await authenticatedApi(`/api/community/posts/${communityPostId}/interact`, authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "encourage" }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.encourageCount).toBeGreaterThanOrEqual(0);
  });

  test("Interact with post - flag", async () => {
    const res = await authenticatedApi(`/api/community/posts/${communityPostId}/interact`, authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "flag" }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.flagCount).toBeGreaterThanOrEqual(0);
  });

  test("Interact with post - 404 for nonexistent post", async () => {
    const res = await authenticatedApi("/api/community/posts/00000000-0000-0000-0000-000000000000/interact", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "like" }),
    });
    await expectStatus(res, 404);
  });

  test("Delete community post", async () => {
    const res = await authenticatedApi(`/api/community/posts/${communityPostId}`, authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test("Delete community post - 404 for nonexistent post", async () => {
    const res = await authenticatedApi("/api/community/posts/00000000-0000-0000-0000-000000000000", authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 404);
  });

  // ============ Spotlight Tests ============
  test("Create community post for spotlight nomination", async () => {
    const res = await authenticatedApi("/api/community/veteran", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "An inspiring story about resilience.",
        isAnonymous: true,
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    communityPostId = data.id;
  });

  test("Nominate post for spotlight", async () => {
    const res = await authenticatedApi("/api/spotlight/nominate", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: communityPostId,
        reason: "Inspiring message about overcoming challenges.",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.postId).toBe(communityPostId);
    expect(data.reason).toBe("Inspiring message about overcoming challenges.");
    expect(data.weekStart).toBeDefined();
    spotlightNominationId = data.id;
  });

  test("Nominate post - 404 for nonexistent post", async () => {
    const res = await authenticatedApi("/api/spotlight/nominate", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: "00000000-0000-0000-0000-000000000000",
        reason: "Reason",
      }),
    });
    await expectStatus(res, 404);
  });

  test("Get current spotlight nominations", async () => {
    const res = await authenticatedApi("/api/spotlight/current", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0].id).toBeDefined();
      expect(data[0].post).toBeDefined();
      expect(data[0].reason).toBeDefined();
      expect(data[0].voteCount).toBeDefined();
      expect(data[0].userVoted).toBeDefined();
    }
  });

  test("Vote for spotlight nomination", async () => {
    const res = await authenticatedApi(`/api/spotlight/vote/${spotlightNominationId}`, authToken, {
      method: "POST",
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.nominationId).toBe(spotlightNominationId);
    expect(data.voteCount).toBeGreaterThanOrEqual(0);
    expect(data.userVoted).toBe(true);
  });

  test("Vote for spotlight - 404 for nonexistent nomination", async () => {
    const res = await authenticatedApi("/api/spotlight/vote/00000000-0000-0000-0000-000000000000", authToken, {
      method: "POST",
    });
    await expectStatus(res, 404);
  });

  test("Get spotlight winner", async () => {
    const res = await authenticatedApi("/api/spotlight/winner", authToken);
    await expectStatus(res, 200, 404);
  });

  // ============ Messages Tests ============
  test("Get daily message", async () => {
    const res = await authenticatedApi("/api/messages/daily", authToken);
    await expectStatus(res, 200, 404);
  });

  test("Get message history", async () => {
    const res = await authenticatedApi("/api/messages/history", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("Get message history with limit", async () => {
    const res = await authenticatedApi("/api/messages/history?limit=10", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  // ============ Progress Insights Tests ============
  test("Get progress insights", async () => {
    const res = await authenticatedApi("/api/progress/insights", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.breathingSessionsThisWeek).toBeDefined();
    expect(typeof data.breathingSessionsThisWeek).toBe("number");
    expect(data.moodCheckIns).toBeDefined();
    expect(typeof data.moodCheckIns).toBe("number");
    expect(data.journalEntries).toBeDefined();
    expect(typeof data.journalEntries).toBe("number");
    expect(data.mostCommonMood).toBeDefined();
    expect(typeof data.mostCommonMood).toBe("string");
  });

  // ============ Donations Tests ============
  test("Create payment intent for donation", async () => {
    const res = await authenticatedApi("/api/donations/create-payment-intent", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 25,
        tier: "friend",
        isRecurring: false,
        isAnonymous: true,
      }),
    });
    await expectStatus(res, 200, 400);
  });

  test("Create payment intent - champion tier", async () => {
    const res = await authenticatedApi("/api/donations/create-payment-intent", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 500,
        tier: "champion",
      }),
    });
    await expectStatus(res, 200, 400);
  });

  test("Create payment intent - missing required fields", async () => {
    const res = await authenticatedApi("/api/donations/create-payment-intent", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 50 }),
    });
    await expectStatus(res, 400);
  });

  test("Confirm donation payment", async () => {
    const res = await authenticatedApi("/api/donations/confirm", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentIntentId: "pi_test_invalid_12345",
        tier: "ally",
      }),
    });
    await expectStatus(res, 200, 400);
  });

  test("Get donation history", async () => {
    const res = await authenticatedApi("/api/donations/history", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("Get donation history with pagination", async () => {
    const res = await authenticatedApi("/api/donations/history?limit=10&offset=5", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  // ============ Breathing Sessions Tests ============
  test("Record breathing session", async () => {
    const res = await authenticatedApi("/api/breathing-sessions", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionType: "box_breathing",
        duration: 300,
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.session.id).toBeDefined();
    expect(data.session.sessionType).toBe("box_breathing");
    expect(data.session.duration).toBe(300);
    expect(data.session.createdAt).toBeDefined();
    breathingSessionId = data.session.id;
  });

  test("Get breathing sessions", async () => {
    const res = await authenticatedApi("/api/breathing-sessions", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0].id).toBeDefined();
      expect(data[0].sessionType).toBeDefined();
      expect(data[0].duration).toBeDefined();
    }
  });

  // ============ Favorites Tests ============
  test("Add breathing exercise to favorites", async () => {
    const res = await authenticatedApi("/api/favorites", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId: "box_breathing" }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.favorite.id).toBeDefined();
    expect(data.favorite.exerciseId).toBe("box_breathing");
    expect(data.favorite.createdAt).toBeDefined();
  });

  test("Get favorite breathing exercises", async () => {
    const res = await authenticatedApi("/api/favorites", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0].id).toBeDefined();
      expect(data[0].exerciseId).toBeDefined();
      expect(data[0].createdAt).toBeDefined();
    }
  });

  test("Remove breathing exercise from favorites", async () => {
    const res = await authenticatedApi("/api/favorites/box_breathing", authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test("Remove from favorites - 404 for nonexistent exercise", async () => {
    const res = await authenticatedApi("/api/favorites/nonexistent_exercise", authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 404);
  });

  // ============ Crisis Resources Tests ============
  test("Get crisis support resources", async () => {
    const res = await api("/api/crisis-resources");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.warning).toBeDefined();
    expect(Array.isArray(data.resources)).toBe(true);
    if (data.resources.length > 0) {
      expect(data.resources[0].region).toBeDefined();
      expect(data.resources[0].name).toBeDefined();
    }
  });

  // ============ Admin Tests ============
  test("Create post for admin moderation", async () => {
    const res = await authenticatedApi("/api/community/veteran", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Post to be flagged for testing moderation.",
        isAnonymous: true,
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    postIdForAdminTest = data.id;
  });

  test("Flag post for moderation", async () => {
    const res = await authenticatedApi(`/api/community/posts/${postIdForAdminTest}/interact`, authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "flag" }),
    });
    await expectStatus(res, 200);
  });

  test("Hide post - 403 for non-admin user", async () => {
    const res = await authenticatedApi(`/api/admin/posts/${postIdForAdminTest}/hide`, authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Inappropriate content" }),
    });
    await expectStatus(res, 403);
  });

  test("Hide post - 404 for nonexistent post", async () => {
    const res = await authenticatedApi("/api/admin/posts/00000000-0000-0000-0000-000000000000/hide", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Inappropriate content" }),
    });
    await expectStatus(res, 404, 403);
  });

  test("Hide post - missing required reason field", async () => {
    const res = await authenticatedApi(`/api/admin/posts/${postIdForAdminTest}/hide`, authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await expectStatus(res, 400, 403);
  });

  test("Unhide post - 403 for non-admin user", async () => {
    const res = await authenticatedApi(`/api/admin/posts/${postIdForAdminTest}/unhide`, authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Post was incorrectly hidden" }),
    });
    await expectStatus(res, 403);
  });

  test("Unhide post - 404 for nonexistent post", async () => {
    const res = await authenticatedApi("/api/admin/posts/00000000-0000-0000-0000-000000000000/unhide", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Post was incorrectly hidden" }),
    });
    await expectStatus(res, 404, 403);
  });

  test("List flagged posts - 403 for non-admin user", async () => {
    const res = await authenticatedApi("/api/admin/flagged-posts", authToken);
    await expectStatus(res, 403);
  });

  // ============ User Data Deletion ============
  test("Delete all user data", async () => {
    const res = await authenticatedApi("/api/user/data", authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toBeDefined();
  });

  // ============ Authentication Tests ============
  test("Journal - 401 without authentication", async () => {
    const res = await api("/api/journal");
    await expectStatus(res, 401);
  });

  test("Community - 401 without authentication", async () => {
    const res = await api("/api/community/veteran");
    await expectStatus(res, 401);
  });

  test("User profile - 401 without authentication", async () => {
    const res = await api("/api/user/profile");
    await expectStatus(res, 401);
  });

  test("User preferences - 401 without authentication", async () => {
    const res = await api("/api/user/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userType: "veteran" }),
    });
    await expectStatus(res, 401);
  });

  test("User disclaimer-status - 401 without authentication", async () => {
    const res = await api("/api/user/disclaimer-status");
    await expectStatus(res, 401);
  });

  test("User disclaimer-accept - 401 without authentication", async () => {
    const res = await api("/api/user/disclaimer-accept", {
      method: "POST",
    });
    await expectStatus(res, 401);
  });

  test("User data deletion - 401 without authentication", async () => {
    const res = await api("/api/user/data", {
      method: "DELETE",
    });
    await expectStatus(res, 401);
  });

  test("Messages - 401 without authentication", async () => {
    const res = await api("/api/messages/history");
    await expectStatus(res, 401);
  });

  test("Progress insights - 401 without authentication", async () => {
    const res = await api("/api/progress/insights");
    await expectStatus(res, 401);
  });

  test("Donations - 401 without authentication", async () => {
    const res = await api("/api/donations/history");
    await expectStatus(res, 401);
  });

  test("Spotlight - 401 without authentication", async () => {
    const res = await api("/api/spotlight/current");
    await expectStatus(res, 401);
  });

  test("Breathing sessions - 401 without authentication", async () => {
    const res = await api("/api/breathing-sessions");
    await expectStatus(res, 401);
  });

  test("Favorites - 401 without authentication", async () => {
    const res = await api("/api/favorites");
    await expectStatus(res, 401);
  });

  // ============ Journal - Negative Cases ============
  test("Create journal entry - missing required mood field", async () => {
    const res = await authenticatedApi("/api/journal", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "No mood provided" }),
    });
    await expectStatus(res, 400);
  });

  test("Create journal entry - invalid mood enum", async () => {
    const res = await authenticatedApi("/api/journal", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood: "invalid_mood" }),
    });
    await expectStatus(res, 400);
  });

  // ============ Community - Negative Cases ============
  test("Create community post - missing required content field", async () => {
    const res = await authenticatedApi("/api/community/veteran", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAnonymous: true }),
    });
    await expectStatus(res, 400);
  });

  test("Create community post - invalid community name", async () => {
    const res = await authenticatedApi("/api/community/invalid_community", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Test" }),
    });
    await expectStatus(res, 400);
  });

  // ============ User Preferences - Negative Cases ============
  test("Update preferences - invalid userType enum", async () => {
    const res = await authenticatedApi("/api/user/preferences", authToken, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userType: "invalid_type" }),
    });
    await expectStatus(res, 400);
  });

  test("Update preferences - invalid messageStream enum", async () => {
    const res = await authenticatedApi("/api/user/preferences", authToken, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageStreams: ["invalid_stream"] }),
    });
    await expectStatus(res, 400);
  });

  // ============ Spotlight - Negative Cases ============
  test("Nominate post - missing required postId field", async () => {
    const res = await authenticatedApi("/api/spotlight/nominate", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Good post" }),
    });
    await expectStatus(res, 400);
  });

  test("Nominate post - missing required reason field", async () => {
    const res = await authenticatedApi("/api/spotlight/nominate", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: "00000000-0000-0000-0000-000000000000" }),
    });
    await expectStatus(res, 400);
  });

  // ============ Donations - Negative Cases ============
  test("Confirm donation - missing required paymentIntentId", async () => {
    const res = await authenticatedApi("/api/donations/confirm", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: "ally" }),
    });
    await expectStatus(res, 400);
  });

  test("Confirm donation - missing required tier", async () => {
    const res = await authenticatedApi("/api/donations/confirm", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId: "pi_test" }),
    });
    await expectStatus(res, 400);
  });

  // ============ Breathing Sessions - Negative Cases ============
  test("Record breathing session - missing required sessionType", async () => {
    const res = await authenticatedApi("/api/breathing-sessions", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duration: 300 }),
    });
    await expectStatus(res, 400);
  });

  test("Record breathing session - missing required duration", async () => {
    const res = await authenticatedApi("/api/breathing-sessions", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionType: "box_breathing" }),
    });
    await expectStatus(res, 400);
  });

  // ============ Favorites - Negative Cases ============
  test("Add to favorites - missing required exerciseId", async () => {
    const res = await authenticatedApi("/api/favorites", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await expectStatus(res, 400);
  });
});
