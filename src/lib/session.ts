import { cookies } from "next/headers";

export async function setSession(userId: string, role: string, storeId?: string | null) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = JSON.stringify({ userId, role, storeId: storeId ?? null, expires });
  
  (await cookies()).set("session", session, { 
    expires, 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
}

export async function getSession(): Promise<{ userId: string; role: string; storeId: string | null; expires: string } | null> {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  return JSON.parse(session);
}

export async function deleteSession() {
  (await cookies()).delete("session");
}
