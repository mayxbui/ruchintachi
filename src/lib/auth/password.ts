import { hash, verify } from "@node-rs/argon2";

// Argon2id with the library's defaults. Recovery codes are hashed the
// same way, since they work like a second password.

export function hashSecret(secret: string): Promise<string> {
  return hash(secret);
}

export async function verifySecret(
  hashed: string,
  secret: string,
): Promise<boolean> {
  try {
    return await verify(hashed, secret);
  } catch {
    return false;
  }
}

// Verified against when the username doesn't exist, so a wrong username
// takes as long as a wrong password and doesn't reveal who has an account.
let dummyHash: Promise<string> | undefined;
export function dummyVerify(secret: string): Promise<boolean> {
  dummyHash ??= hash("not-a-real-password");
  return dummyHash.then((h) => verifySecret(h, secret)).then(() => false);
}
