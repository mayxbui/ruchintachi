import { eq } from "drizzle-orm";
import type { Db } from "./accounts";
import { inventory } from "./schema";

/** Every item the user owns, with how many of each. Private to the owner. */
export function listInventory(db: Db, userId: string): { itemId: string; quantity: number }[] {
  return db
    .select({ itemId: inventory.itemId, quantity: inventory.quantity })
    .from(inventory)
    .where(eq(inventory.userId, userId))
    .all();
}
