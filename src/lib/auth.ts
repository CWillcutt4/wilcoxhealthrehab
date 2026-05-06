import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import type { Employee, User } from "@prisma/client";

const USER_COOKIE = "sfc_session";
const EMPLOYEE_COOKIE = "sfc_admin_session";
const SESSION_DAYS = 30;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function newToken(): string {
  return randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ─── Member sessions ──────────────────────────────────────────────────────
export async function createUserSession(userId: string): Promise<string> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { token: hashToken(token), userId, expiresAt },
  });
  const jar = await cookies();
  jar.set(USER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(USER_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token: hashToken(token) },
    include: { user: true },
  });
  if (!session || !session.user || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function destroyUserSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(USER_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token: hashToken(token) } });
  }
  jar.delete(USER_COOKIE);
}

// ─── Employee sessions ────────────────────────────────────────────────────
export async function createEmployeeSession(employeeId: string): Promise<string> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { token: hashToken(token), employeeId, expiresAt },
  });
  const jar = await cookies();
  jar.set(EMPLOYEE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function getCurrentEmployee(): Promise<Employee | null> {
  const jar = await cookies();
  const token = jar.get(EMPLOYEE_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token: hashToken(token) },
    include: { employee: true },
  });
  if (!session || !session.employee || session.expiresAt < new Date()) return null;
  return session.employee;
}

export async function destroyEmployeeSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(EMPLOYEE_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token: hashToken(token) } });
  }
  jar.delete(EMPLOYEE_COOKIE);
}
