"use client";

import { createClient } from "@/lib/supabase/client";

const USER_KEY = "learnos_current_user";
const ALL_USERS_KEY = "learnos_all_users";
const PASSWORD_KEY = "learnos_passwords";
const MAX_USERS = 10;

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const ALLOWED_EMAIL_DOMAINS = new Set([
  "qq.com", "vip.qq.com", "foxmail.com",
  "163.com", "vip.163.com", "126.com", "yeah.net",
  "sina.com", "sina.cn", "sohu.com", "aliyun.com",
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com",
  "yahoo.com", "yahoo.com.cn", "ymail.com",
  "icloud.com", "me.com", "mac.com",
  "proton.me", "protonmail.com", "aol.com", "zoho.com", "yandex.com", "mail.com", "fastmail.com",
  "edu.cn",
]);

// ========== Supabase CRUD ==========

function getSupa() { try { return createClient(); } catch { return null; } }

async function saveUserToCloud(user: UserInfo, passwordHash: string): Promise<boolean> {
  try {
    const supa = getSupa(); if (!supa) return false;
    const { error: e1 } = await supa.from("learnos_users").upsert({
      id: user.id, email: user.email, name: user.name,
      password_hash: passwordHash, created_at: user.createdAt,
    });
    const { error: e2 } = await supa.from("learnos_passwords").upsert({
      email: user.email, password_hash: passwordHash,
    });
    return !e1 && !e2;
  } catch { return false; }
}

async function fetchUserFromCloud(email: string): Promise<{ user: UserInfo; passwordHash: string } | null> {
  try {
    const supa = getSupa(); if (!supa) return null;
    const { data, error } = await supa.from("learnos_users").select("*").eq("email", email).maybeSingle();
    if (error || !data) return null;
    return {
      user: { id: data.id, name: data.name, email: data.email, createdAt: data.created_at },
      passwordHash: data.password_hash,
    };
  } catch { return null; }
}

async function fetchAllFromCloud(): Promise<{ user: UserInfo; passwordHash: string }[]> {
  try {
    const supa = getSupa(); if (!supa) return [];
    const { data } = await supa.from("learnos_users").select("*").order("created_at", { ascending: false }).limit(10);
    if (!data) return [];
    return data.map((d: any) => ({
      user: { id: d.id, name: d.name, email: d.email, createdAt: d.created_at },
      passwordHash: d.password_hash,
    }));
  } catch { return []; }
}

// ========== 本地缓存 ==========

function getLocalUser(): UserInfo | null {
  if (typeof window === "undefined") return null;
  try { const r = localStorage.getItem(USER_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

function setLocalUser(user: UserInfo | null): void {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

function getLocalUsers(): UserInfo[] {
  if (typeof window === "undefined") return [];
  try { const r = localStorage.getItem(ALL_USERS_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}

function saveLocalUsers(users: UserInfo[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users.slice(0, MAX_USERS)));
}

function getLocalPasswordStore(): Record<string, string> {
  try { const r = localStorage.getItem(PASSWORD_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; }
}

function saveLocalPassword(email: string, hash: string): void {
  const store = getLocalPasswordStore();
  store[email.trim().toLowerCase()] = hash;
  localStorage.setItem(PASSWORD_KEY, JSON.stringify(store));
}

// ========== 公开 API ==========

export function isValidEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return "请输入邮箱地址";
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(trimmed)) return "邮箱格式不正确，请输入完整邮箱地址";
  return ""; // 不限制域名，任何合法邮箱均可注册
}

export function isValidPassword(password: string): { valid: boolean; reason: string } {
  if (password.length < 6) return { valid: false, reason: "密码至少需要6位" };
  if (!/[a-zA-Z]/.test(password)) return { valid: false, reason: "密码必须包含字母" };
  if (!/[0-9]/.test(password)) return { valid: false, reason: "密码必须包含数字" };
  return { valid: true, reason: "" };
}

export function getCurrentUser(): UserInfo | null {
  return getLocalUser();
}

export function findUserByEmail(email: string): UserInfo | undefined {
  return getAllUsers().find((u) => u.email === email.trim().toLowerCase());
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode("learnos_salt_" + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** 注册：云端+本地双写 */
export async function registerWithEmail(email: string, name: string, password: string): Promise<UserInfo> {
  const normalizedEmail = email.trim().toLowerCase();
  const hash = await hashPassword(password);
  const user: UserInfo = {
    id: "u-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    name: name.trim(),
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
  };
  // 本地
  setLocalUser(user);
  saveLocalPassword(normalizedEmail, hash);
  const localUsers = getLocalUsers().filter(u => u.id !== user.id);
  localUsers.unshift(user);
  saveLocalUsers(localUsers);
  // 云端同步
  const cloudOk = await saveUserToCloud(user, hash);
  if (!cloudOk) console.warn("[注册] Supabase同步失败");
  return user;
}

/** 登录：云端优先，本地兜底 */
export async function loginWithEmail(email: string, password: string): Promise<UserInfo | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const inputHash = await hashPassword(password);

  // 1. 查云端
  const cloud = await fetchUserFromCloud(normalizedEmail).catch(() => null);
  if (cloud) {
    if (cloud.passwordHash === inputHash) {
      setLocalUser(cloud.user);
      syncLocalUsers();
      return cloud.user;
    }
    return null;
  }

  // 2. 云端无，兜底本地
  const localUsers = getLocalUsers();
  const localUser = localUsers.find(u => u.email === normalizedEmail);
  if (!localUser) return null;
  const localPw = getLocalPasswordStore();
  const storedHash = localPw[normalizedEmail];
  if (!storedHash) { setLocalUser(localUser); return localUser; }
  if (inputHash !== storedHash) return null;
  setLocalUser(localUser);
  return localUser;
}

async function syncLocalUsers() {
  const cloudUsers = await fetchAllFromCloud().catch(() => []);
  if (cloudUsers.length > 0) {
    saveLocalUsers(cloudUsers.map(c => c.user));
    const pwStore: Record<string, string> = {};
    cloudUsers.forEach(c => { pwStore[c.user.email] = c.passwordHash; });
    localStorage.setItem(PASSWORD_KEY, JSON.stringify({ ...getLocalPasswordStore(), ...pwStore }));
  }
}

export function logout(): void { localStorage.removeItem(USER_KEY); }

export function switchUser(user: UserInfo): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAllUsers(): UserInfo[] {
  if (typeof window === "undefined") return [];
  return getLocalUsers();
}

export function updateUserName(name: string): UserInfo | null {
  const user = getCurrentUser();
  if (!user) return null;
  user.name = name.trim();
  setLocalUser(user);
  const users = getLocalUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) { users[idx] = user; saveLocalUsers(users); }
  return user;
}

export function userKey(baseKey: string): string {
  const user = getCurrentUser();
  return user ? `${user.id}_${baseKey}` : baseKey;
}
