import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isHomeGroupPath,
  resolveActiveTabIndex,
} from "./floatingTabBarActive";

const tabs = [
  { name: "(home)", route: "/(tabs)/(home)/" },
  { name: "journal", route: "/(tabs)/(home)/?tab=journal" },
  { name: "panic", route: "/panic" },
  { name: "veterans", route: "/(tabs)/veterans" },
  { name: "profile", route: "/(tabs)/profile" },
];

describe("isHomeGroupPath", () => {
  it("recognizes grouped and Android-stripped home paths", () => {
    assert.equal(isHomeGroupPath("/(tabs)/(home)"), true);
    assert.equal(isHomeGroupPath("/(tabs)/(home)/"), true);
    assert.equal(isHomeGroupPath("/(tabs)/(home)/index"), true);
    assert.equal(isHomeGroupPath("/"), true);
    assert.equal(isHomeGroupPath("/index"), true);
    assert.equal(isHomeGroupPath("/veterans"), false);
    assert.equal(isHomeGroupPath("/(tabs)/veterans"), false);
    assert.equal(isHomeGroupPath("/profile"), false);
    assert.equal(isHomeGroupPath("/panic"), false);
  });
});

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

  it("Android: empty global search params + homeTabMode journal on stripped /", () => {
    // Physical Android often reports pathname "/" and no tab in useGlobalSearchParams
    const idx = resolveActiveTabIndex(tabs, "/", {}, { homeTabMode: "journal" });
    assert.equal(idx, 1);
    assert.notEqual(idx, 0);
  });

  it("Android: empty params + homeTabMode journal on grouped home path", () => {
    const idx = resolveActiveTabIndex(
      tabs,
      "/(tabs)/(home)",
      {},
      { homeTabMode: "journal" }
    );
    assert.equal(idx, 1);
  });

  it("Android: empty params + homeTabMode home keeps Home active", () => {
    assert.equal(
      resolveActiveTabIndex(tabs, "/", {}, { homeTabMode: "home" }),
      0
    );
  });

  it("stale journal homeTabMode does not win on Veterans (Android stripped)", () => {
    assert.equal(
      resolveActiveTabIndex(
        tabs,
        "/veterans",
        {},
        { homeTabMode: "journal" }
      ),
      3
    );
    assert.equal(
      resolveActiveTabIndex(
        tabs,
        "/(tabs)/veterans",
        {},
        { homeTabMode: "journal" }
      ),
      3
    );
  });

  it("explicit searchParams.tab wins over conflicting homeTabMode", () => {
    assert.equal(
      resolveActiveTabIndex(
        tabs,
        "/(tabs)/(home)",
        { tab: "journal" },
        { homeTabMode: "home" }
      ),
      1
    );
    assert.equal(
      resolveActiveTabIndex(
        tabs,
        "/(tabs)/(home)",
        { tab: "home" },
        { homeTabMode: "journal" }
      ),
      0
    );
  });

  it("marks Veterans and Profile by pathname (grouped and stripped)", () => {
    assert.equal(resolveActiveTabIndex(tabs, "/(tabs)/veterans", {}), 3);
    assert.equal(resolveActiveTabIndex(tabs, "/veterans", {}), 3);
    assert.equal(resolveActiveTabIndex(tabs, "/(tabs)/profile", {}), 4);
    assert.equal(resolveActiveTabIndex(tabs, "/profile", {}), 4);
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

  it("community mode on home does not leave Journal highlighted", () => {
    const idx = resolveActiveTabIndex(
      tabs,
      "/",
      {},
      { homeTabMode: "community" }
    );
    assert.notEqual(idx, 1);
  });
});
