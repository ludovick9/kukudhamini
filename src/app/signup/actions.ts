"use server";

import { redirect } from "next/navigation";
import { createSessionForUser, hashPassword, isStrongPassword, normalizeEmail } from "@/lib/auth";
import { getPrisma, isDatabaseConfigured } from "@/server/db";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_FEED_PRODUCTS } from "@/lib/reference-data";
import { logger } from "@/server/logger";

export type AuthActionState = { ok: boolean; message: string };

export async function signupAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    if (!isDatabaseConfigured()) {
      return { ok: false, message: "Something went wrong. Please try again." };
    }

    const name = String(formData.get("name") ?? "").trim();
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!name) return { ok: false, message: "Full name is required." };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Please enter a valid email." };
    if (!isStrongPassword(password)) return { ok: false, message: "Password must be at least 8 characters and include a number." };
    if (password !== confirmPassword) return { ok: false, message: "Passwords do not match." };

    const existingUser = await getPrisma().user.findUnique({ where: { email } });
    if (existingUser) return { ok: false, message: "An account with this email already exists." };

    const result = await getPrisma().$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: hashPassword(password),
        },
      });

      const farm = await tx.farm.create({
        data: {
          name: `${name.split(" ")[0]}'s Farm`,
          location: "New farm",
          currency: "TZS",
          timezone: "Africa/Dar_es_Salaam",
        },
      });

      await tx.farmMembership.create({
        data: {
          userId: user.id,
          farmId: farm.id,
          role: "OWNER",
        },
      });

      await tx.expenseCategory.createMany({
        data: DEFAULT_EXPENSE_CATEGORIES.map((name) => ({ farmId: farm.id, name })),
        skipDuplicates: true,
      });

      await tx.feedProduct.createMany({
        data: DEFAULT_FEED_PRODUCTS.map((product) => ({ ...product, farmId: farm.id })),
        skipDuplicates: true,
      });

      return user.id;
    });

    await createSessionForUser(result);
    redirect("/dashboard");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    logger.error("Signup action failed", error, { operation: "signupAction" });
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
