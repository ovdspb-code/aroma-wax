"use server";

import { redirect } from "next/navigation";
import { grantAccess } from "@/lib/password";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!process.env.APP_PASSWORD) {
    throw new Error("APP_PASSWORD is not configured.");
  }

  if (password !== process.env.APP_PASSWORD) {
    redirect("/?error=1");
  }

  await grantAccess();
  redirect("/");
}
