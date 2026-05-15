import { cookies } from "next/headers";
import { crypto } from "node:crypto";

const ENCRYPTION_KEY = process.env.SESSION_SECRET || "akiba_ai_secret_key_32_chars_long!!"; 

export async function setSession(userId: string, role: string, storeId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = JSON.stringify({ userId, role, storeId, expires });
  
  (await cookies()).set("session", session, { 
    expires, 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  return JSON.parse(session);
}

export async function deleteSession() {
  (await cookies()).delete("session");
}
