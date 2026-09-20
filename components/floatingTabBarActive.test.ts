import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveActiveTabIndex } from "./floatingTabBarActive";

const tabs = [
  { name: "(home)", route: "/(tabs)/(home)/" },
  { name: "journal", route: "/(tabs)/(home)/?tab=journal" },
  { name: "panic", route: "/panic" },
  { name: "veterans", route: "/(tabs)/veterans" },
  { name: "profile", route: "/(tabs)/profile" },
];

describe("resolveActiveTabIndex", () => {
  it("marks Home active on home path without tab param", () => {
    assert.equal(resolveActiveTabIndex(tabs, "/(tabs)/(home)", {}), 0);
    assert.equal(resolveActiveTabIndex(tabs, "/(tabs)/(home)/", {}), 0);
  });

  it("marks Journal active when tab=journal (Home inactive)", () => {
    assert.equal(
      resolveActiveTabIndex(tabs, "/(tabs)/(home)", { tab: "journal" }),
      1
    );
    assert.equal(
      resolveActiveTabIndex(tabs, "/(tabs)/(home)/", { tab: "journal" }),
      1
    );
  });

  it("does not keep Home active for nested home path with journal param", () => {
    const idx = resolveActiveTabIndex(tabs, "/(tabs)/(home)/index", {
      tab: "journal",
    });
    assert.equal(idx, 1);
    assert.notEqual(idx, 0);
  });

  it("marks Veterans and Profile by pathname", () => {
    assert.equal(resolveActiveTabIndex(tabs, "/(tabs)/veterans", {}), 3);
    assert.equal(resolveActiveTabIndex(tabs, "/(tabs)/profile", {}), 4);
  });

  it("marks Panic by pathname", () => {
    assert.equal(resolveActiveTabIndex(tabs, "/panic", {}), 2);
  });

  it("marks Home active when tab=home after leaving journal", () => {
    assert.equal(
      resolveActiveTabIndex(tabs, "/(tabs)/(home)", { tab: "home" }),
      0
    );
  });
});
