"use client";

const USER_KEY = "learnos_current_user";
const ALL_USERS_KEY = "learnos_all_users";
const PASSWORD_KEY = "learnos_passwords"; // { [email]: hash }
const MAX_USERS = 10;

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

/** 主流邮箱域名白名单 */
const ALLOWED_EMAIL_DOMAINS = new Set([
  // 国内
  "qq.com", "vip.qq.com", "foxmail.com",
  "163.com", "vip.163.com", "126.com", "yeah.net",
  "sina.com", "sina.cn", "sohu.com",
  "aliyun.com",
  // 国际
  "gmail.com", "googlemail.com",
  "outlook.com", "hotmail.com", "live.com", "msn.com",
  "yahoo.com", "yahoo.com.cn", "ymail.com",
  "icloud.com", "me.com", "mac.com",
  "proton.me", "protonmail.com",
  "aol.com", "zoho.com", "yandex.com", "mail.com", "fastmail.com",
  // 教育
  "edu.cn",
]);

/** 验证邮箱格式 + 域名是否合法 */
export function isValidEmail(email: string): string {
  // "" = 通过, 其他字符串 = 错误原因
  const trimmed = email.trim();
  if (!trimmed) return "请输入邮箱地址";

  // 基础格式检查
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
    return "邮箱格式不正确，请输入完整邮箱";
  }

  // 提取域名并检查
  const atIndex = trimmed.lastIndexOf("@");
  const domain = trimmed.slice(atIndex + 1).toLowerCase();

  // 精确匹配
  if (ALLOWED_EMAIL_DOMAINS.has(domain)) return "";

  // 通配匹配 .edu.cn（如 xxx.edu.cn）
  if (domain.endsWith(".edu.cn")) return "";

  return `不支持该邮箱域名（${domain}），请使用 QQ、163、Gmail、Outlook 等主流邮箱`;
}

/** 验证密码强度（至少6位，必须包含字母和数字） */
export function isValidPassword(password: string): { valid: boolean; reason: string } {
  if (password.length < 6) return { valid: false, reason: "密码至少需要6位" };
  if (!/[a-zA-Z]/.test(password)) return { valid: false, reason: "密码必须包含字母" };
  if (!/[0-9]/.test(password)) return { valid: false, reason: "密码必须包含数字" };
  return { valid: true, reason: "" };
}

export function getCurrentUser(): UserInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/** 查找邮箱是否已注册 */
export function findUserByEmail(email: string): UserInfo | undefined {
  const normalized = email.trim().toLowerCase();
  return getAllUsers().find((u) => u.email === normalized);
}

// ========== 密码处理（使用 Web Crypto SHA-256） ==========

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode("learnos_salt_" + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getPasswordStore(): Promise<Record<string, string>> {
  try {
    const raw = localStorage.getItem(PASSWORD_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function savePassword(email: string, hash: string): Promise<void> {
  const store = await getPasswordStore();
  store[email.trim().toLowerCase()] = hash;
  localStorage.setItem(PASSWORD_KEY, JSON.stringify(store));
}

/** 注册：创建新用户（异步，需要哈希密码） */
export async function registerWithEmail(email: string, name: string, password: string): Promise<UserInfo> {
  const normalizedEmail = email.trim().toLowerCase();

  // 保存密码哈希
  const hash = await hashPassword(password);
  await savePassword(normalizedEmail, hash);

  // 创建用户
  const user: UserInfo = {
    id: "u-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    name: name.trim(),
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  saveUserToList(user);
  return user;
}

/** 登录：验证邮箱和密码（异步） */
export async function loginWithEmail(email: string, password: string): Promise<UserInfo | null> {
  const existing = findUserByEmail(email);
  if (!existing) return null;

  // 验证密码
  const store = await getPasswordStore();
  const storedHash = store[email.trim().toLowerCase()];
  if (!storedHash) {
    // 旧用户没有密码（迁移场景）：直接登录
    localStorage.setItem(USER_KEY, JSON.stringify(existing));
    return existing;
  }

  const inputHash = await hashPassword(password);
  if (inputHash !== storedHash) return null; // 密码错误

  localStorage.setItem(USER_KEY, JSON.stringify(existing));
  return existing;
}

/** 设置/修改昵称 */
export function updateUserName(name: string): UserInfo | null {
  const user = getCurrentUser();
  if (!user) return null;
  user.name = name.trim();
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  updateUserInList(user);
  return user;
}

export function logout(): void {
  localStorage.removeItem(USER_KEY);
}

export function switchUser(user: UserInfo): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** 获取带用户前缀的 storage key，实现数据隔离 */
export function userKey(baseKey: string): string {
  const user = getCurrentUser();
  if (!user) return baseKey;
  return `${user.id}_${baseKey}`;
}

export function getAllUsers(): UserInfo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ALL_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveUserToList(user: UserInfo): void {
  const users = getAllUsers().filter((u) => u.id !== user.id);
  users.unshift(user);
  localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users.slice(0, MAX_USERS)));
}

function updateUserInList(user: UserInfo): void {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    users[idx] = user;
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
  }
}
