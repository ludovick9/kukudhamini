"use server";

import { redirect } from "next/navigation";
import { createSessionForUser, getCurrentSession, normalizeEmail, verifyPassword } from "@/lib/auth";
import { getPrisma, isDatabaseConfigured } from "@/server/db";
import { logger } from "@/server/logger";

export type AuthActionState = { ok: boolean; message: string };

export async function loginAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    if (!isDatabaseConfigured()) {
      return { ok: false, message: "Invalid email or password." };
    }

    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return { ok: false, message: "Invalid email or password." };
    }

    const user = await getPrisma().user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return { ok: false, message: "Invalid email or password." };
    }

    const existing = await getCurrentSession();
    if (existing && existing.userId === user.id) {
      redirect("/dashboard");
    }

    await createSessionForUser(user.id);
    redirect("/dashboard");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    logger.error("Login action failed", error, { operation: "loginAction" });
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
