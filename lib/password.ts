import { cookies } from "next/headers";

const COOKIE_NAME = "aw_labels_session";

export async function hasAccess() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === "granted";
}

export async function grantAccess() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "granted", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}
