import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma, isDatabaseConfigured } from "@/server/db";
import type { Farm, User } from "@/domain/types";
import { canMutateFarm } from "@/lib/domain-rules";

export const SESSION_COOKIE_NAME = "kukudhamini_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export type AuthenticatedSession = {
  id: string;
  userId: string;
  expiresAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    passwordHash: string | null;
  };
};

export type FarmMutationRole = "OWNER" | "MANAGER";

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 120000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
  return `${salt}:${iterations}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;
  const [salt, iterationString, actualHash] = storedHash.split(":");
  if (!salt || !iterationString || !actualHash) return false;

  const iterations = Number(iterationString);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;

  const candidate = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
  const expected = Buffer.from(actualHash, "hex");
  const actual = Buffer.from(candidate, "hex");

  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function hashToken(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function createSessionForUser(userId: string) {
  if (!isDatabaseConfigured()) {
    throw new Error("Authentication requires a configured database.");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const cookieStore = await cookies();
  const tokenHash = hashToken(token);

  await getPrisma().session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });

  return token;
}

export async function revokeSessionToken(token?: string | null) {
  if (!token) return;
  const tokenHash = hashToken(token);
  await getPrisma().session.deleteMany({
    where: { tokenHash },
  });
}

export async function getCurrentSession(): Promise<AuthenticatedSession | null> {
  if (!isDatabaseConfigured()) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await getPrisma().session.findFirst({
    where: {
      tokenHash,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
        },
      },
    },
  });

  if (!session) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return {
    id: session.id,
    userId: session.userId,
    expiresAt: session.expiresAt,
    user: session.user,
  };
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export async function getAuthenticatedFarmContext() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const prisma = getPrisma();
  const membership = await prisma.farmMembership.findFirst({
    where: { userId: session.userId },
    include: { farm: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    redirect("/login");
  }

  const user: User = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: membership.role,
    initials: session.user.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U",
  };

  const farm: Farm = {
    id: membership.farm.id,
    name: membership.farm.name,
    location: membership.farm.location,
    currency: membership.farm.currency,
    timezone: membership.farm.timezone,
    unreadNotificationCount: await prisma.notification.count({ where: { farmId: membership.farm.id, readAt: null } }),
  };

  return { user, farm };
}

export async function requireFarmMutationAccess(farmId: string) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const membership = await getPrisma().farmMembership.findFirst({
    where: { userId: session.userId, farmId },
    select: { role: true },
  });

  if (!membership) {
    throw new Error("You do not have access to this farm.");
  }

    if (!canMutateFarm(membership.role)) {
    throw new Error("Manager access is required for this action.");
  }

  return membership;
}

export async function logoutCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await revokeSessionToken(token);
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
