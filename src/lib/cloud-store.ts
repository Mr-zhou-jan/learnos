"use client";

import { createClient } from "@/lib/supabase/client";

function getSupa() { try { return createClient(); } catch { return null; } }

/** 保存单条数据到云端 */
export async function saveCloudData(userId: string, key: string, value: string): Promise<boolean> {
  try {
    const supa = getSupa(); if (!supa) return false;
    const { error } = await supa.from("learnos_kv").upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() });
    return !error;
  } catch { return false; }
}

/** 加载某个用户的所有云端数据 */
export async function loadAllCloudData(userId: string): Promise<Record<string, string>> {
  try {
    const supa = getSupa(); if (!supa) return {};
    const { data } = await supa.from("learnos_kv").select("key,value").eq("user_id", userId);
    if (!data) return {};
    const result: Record<string, string> = {};
    data.forEach((row: any) => { result[row.key] = row.value; });
    return result;
  } catch { return {}; }
}

/** 批量上传当前用户的所有 localStorage 到云端 */
export async function syncAllToCloud(userId: string): Promise<number> {
  if (typeof window === "undefined" || !userId) return 0;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith("learnos_") || k.startsWith(userId))) keys.push(k);
  }
  let count = 0;
  for (let i = 0; i < keys.length; i += 20) {
    const batch = keys.slice(i, i + 20);
    const results = await Promise.all(batch.map(k => {
      const v = localStorage.getItem(k) || "";
      return saveCloudData(userId, k, v.length > 50000 ? v.slice(0, 50000) : v);
    }));
    count += results.filter(Boolean).length;
  }
  return count;
}

/** 从云端恢复所有数据到 localStorage */
export async function restoreFromCloud(userId: string): Promise<number> {
  if (typeof window === "undefined" || !userId) return 0;
  const data = await loadAllCloudData(userId);
  let count = 0;
  for (const [key, value] of Object.entries(data)) {
    try { localStorage.setItem(key, value); count++; } catch {}
  }
  return count;
}
