import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus } from "./helpers";

const json = { "Content-Type": "application/json" };

async function createPost(token: string, content: string, isAnonymous = true, community = "healing_together") {
  const res = await authenticatedApi(`/api/community/${community}`, token, {
    method: "POST",
    headers: json,
    body: JSON.stringify({ content, isAnonymous }),
  });
  await expectStatus(res, 201);
  return (await res.json()) as { id: string; isOwnPost: boolean };
}

async function feed(token: string, community = "healing_together") {
  const res = await authenticatedApi(`/api/community/${community}?limit=100`, token);
  await expectStatus(res, 200);
  return (await res.json()) as { id: string; isOwnPost: boolean; authorId?: string }[];
}

describe("Member blocking", () => {
  test("Block endpoints require authentication", async () => {
    await expectStatus(await api("/api/blocks"), 401);
    await expectStatus(
      await api("/api/blocks", { method: "POST", headers: json, body: JSON.stringify({ postId: crypto.randomUUID() }) }),
      401
    );
    await expectStatus(await api(`/api/blocks/${crypto.randomUUID()}`, { method: "DELETE" }), 401);
  });

  test("Public status endpoint reports availability", async () => {
    const res = await api("/api/blocks/status");
    await expectStatus(res, 200);
    expect((await res.json()).available).toBe(true);
  });

  test("Block hides content both ways; unblock restores it; self-block rejected", async () => {
    const alice = await signUpTestUser();
    const bob = await signUpTestUser();

    const bobPost = await createPost(bob.token, "post from bob (anonymous)", true);
    const alicePost = await createPost(alice.token, "post from alice (named)", false);
    expect(alicePost.isOwnPost).toBe(true);

    // Feed marks own posts and never exposes author ids
    const aliceFeed = await feed(alice.token);
    const bobInAliceFeed = aliceFeed.find((p) => p.id === bobPost.id);
    expect(bobInAliceFeed?.isOwnPost).toBe(false);
    expect(aliceFeed.find((p) => p.id === alicePost.id)?.isOwnPost).toBe(true);
    expect(aliceFeed.every((p) => p.authorId === undefined)).toBe(true);

    // Can't block yourself
    const selfRes = await authenticatedApi("/api/blocks", alice.token, {
      method: "POST",
      headers: json,
      body: JSON.stringify({ postId: alicePost.id }),
    });
    await expectStatus(selfRes, 400);
    const selfById = await authenticatedApi("/api/blocks", alice.token, {
      method: "POST",
      headers: json,
      body: JSON.stringify({ userId: alice.user.id }),
    });
    await expectStatus(selfById, 400);

    // Bad input
    await expectStatus(
      await authenticatedApi("/api/blocks", alice.token, { method: "POST", headers: json, body: JSON.stringify({}) }),
      400
    );
    await expectStatus(
      await authenticatedApi("/api/blocks", alice.token, {
        method: "POST",
        headers: json,
        body: JSON.stringify({ postId: crypto.randomUUID() }),
      }),
      404
    );

    // Alice blocks Bob via his anonymous post (idempotent)
    const blockRes = await authenticatedApi("/api/blocks", alice.token, {
      method: "POST",
      headers: json,
      body: JSON.stringify({ postId: bobPost.id }),
    });
    await expectStatus(blockRes, 201);
    const block = await blockRes.json();
    expect(block.displayName).toBe("Anonymous member");
    const again = await authenticatedApi("/api/blocks", alice.token, {
      method: "POST",
      headers: json,
      body: JSON.stringify({ postId: bobPost.id }),
    });
    await expectStatus(again, 201);
    expect((await again.json()).id).toBe(block.id);

    // Hidden for Alice, and Alice's posts hidden for Bob
    expect((await feed(alice.token)).some((p) => p.id === bobPost.id)).toBe(false);
    expect((await feed(bob.token)).some((p) => p.id === alicePost.id)).toBe(false);

    // List shows one entry with the anonymous label only
    const listRes = await authenticatedApi("/api/blocks", alice.token);
    await expectStatus(listRes, 200);
    const list = await listRes.json();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(block.id);
    expect(list[0].displayName).toBe("Anonymous member");
    expect(JSON.stringify(list)).not.toContain(bob.user.id);

    // Bob can't remove Alice's block
    await expectStatus(
      await authenticatedApi(`/api/blocks/${block.id}`, bob.token, { method: "DELETE", headers: json, body: "{}" }),
      404
    );

    // Unblock restores visibility
    await expectStatus(
      await authenticatedApi(`/api/blocks/${block.id}`, alice.token, { method: "DELETE", headers: json, body: "{}" }),
      200
    );
    expect((await feed(alice.token)).some((p) => p.id === bobPost.id)).toBe(true);
    expect((await feed(bob.token)).some((p) => p.id === alicePost.id)).toBe(true);
    const after = await (await authenticatedApi("/api/blocks", alice.token)).json();
    expect(after.length).toBe(0);
  });

  test("Named post block uses the shown author name", async () => {
    const carol = await signUpTestUser();
    const dave = await signUpTestUser();
    const davePost = await createPost(dave.token, "named post from dave", false, "veteran");
    const res = await authenticatedApi("/api/blocks", carol.token, {
      method: "POST",
      headers: json,
      body: JSON.stringify({ postId: davePost.id }),
    });
    await expectStatus(res, 201);
    expect((await res.json()).displayName).toBe(dave.user.name);
    expect((await feed(carol.token, "veteran")).some((p) => p.id === davePost.id)).toBe(false);
  });

  test("Account deletion removes block rows in both directions", async () => {
    const erin = await signUpTestUser();
    const frank = await signUpTestUser();
    const frankPost = await createPost(frank.token, "frank post", true);
    const erinPost = await createPost(erin.token, "erin post", true);

    // erin blocks frank, frank blocks erin
    await expectStatus(
      await authenticatedApi("/api/blocks", erin.token, { method: "POST", headers: json, body: JSON.stringify({ postId: frankPost.id }) }),
      201
    );
    await expectStatus(
      await authenticatedApi("/api/blocks", frank.token, { method: "POST", headers: json, body: JSON.stringify({ postId: erinPost.id }) }),
      201
    );

    // Frank deletes his account through the product deletion path
    const del = await authenticatedApi("/api/user/data", frank.token, {
      method: "DELETE",
      headers: json,
      body: JSON.stringify({ password: "TestPassword123!" }),
    });
    await expectStatus(del, 200);

    const list = await (await authenticatedApi("/api/blocks", erin.token)).json();
    expect(list.length).toBe(0);
  });
});
