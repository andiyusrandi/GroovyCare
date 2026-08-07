import { cookies } from "next/headers";

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
  institutionId?: string | null;
}

const COOKIE_NAME = "pbf_session";

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }
  try {
    const rawData = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    return JSON.parse(rawData) as SessionData;
  } catch (error) {
    return null;
  }
}

export async function setSession(data: SessionData) {
  const cookieStore = await cookies();
  const rawValue = Buffer.from(JSON.stringify(data)).toString("base64");
  cookieStore.set(COOKIE_NAME, rawValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
    expires: new Date(0),
  });
  cookieStore.delete(COOKIE_NAME);
}
