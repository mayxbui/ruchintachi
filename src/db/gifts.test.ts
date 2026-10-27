import { describe, expect, it } from "vitest";
import { createAccount } from "./accounts";
import { awardDailyGift, dailyGiftOn } from "./gifts";
import { listInventory } from "./inventory";
import * as schema from "./schema";
import { createTestDb } from "./test-db";

function addUser(db: ReturnType<typeof createTestDb>, username: string) {
  const user = createAccount(db, {
    username,
    passwordHash: "p",
    recoveryCodeHash: "r",
    timeZone: "UTC",
  });
  if (!user) throw new Error("username taken");
  return user.id;
}

function quantities(db: ReturnType<typeof createTestDb>) {
  return db
    .select({ userId: schema.inventory.userId, itemId: schema.inventory.itemId, quantity: schema.inventory.quantity })
    .from(schema.inventory)
    .all();
}

describe("awardDailyGift", () => {
  it("awards a day's gift once and adds it to the inventory once", () => {
    const db = createTestDb();
    const may = addUser(db, "may");

    expect(awardDailyGift(db, may, "2026-10-26", "abokado")).toBe(true);
    // A second tick, or a different roll, the same day changes nothing.
    expect(awardDailyGift(db, may, "2026-10-26", "abokado")).toBe(false);
    expect(awardDailyGift(db, may, "2026-10-26", "bacon")).toBe(false);

    expect(dailyGiftOn(db, may, "2026-10-26")).toBe("abokado");
    expect(quantities(db)).toEqual([{ userId: may, itemId: "abokado", quantity: 1 }]);
  });

  it("stacks duplicates across days", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    awardDailyGift(db, may, "2026-10-25", "abokado");
    awardDailyGift(db, may, "2026-10-26", "abokado");
    awardDailyGift(db, may, "2026-10-27", "bacon");

    expect(quantities(db).sort((a, b) => a.itemId.localeCompare(b.itemId))).toEqual([
      { userId: may, itemId: "abokado", quantity: 2 },
      { userId: may, itemId: "bacon", quantity: 1 },
    ]);
  });

  it("keeps each user's gifts and inventory separate", () => {
    const db = createTestDb();
    const may = addUser(db, "may");
    const kai = addUser(db, "kai");
    awardDailyGift(db, may, "2026-10-26", "abokado");

    expect(awardDailyGift(db, kai, "2026-10-26", "bacon")).toBe(true);
    expect(dailyGiftOn(db, may, "2026-10-26")).toBe("abokado");
    expect(dailyGiftOn(db, kai, "2026-10-26")).toBe("bacon");
    expect(dailyGiftOn(db, kai, "2026-10-25")).toBeUndefined();
    expect(listInventory(db, may)).toEqual([{ itemId: "abokado", quantity: 1 }]);
    expect(listInventory(db, kai)).toEqual([{ itemId: "bacon", quantity: 1 }]);
  });
});
