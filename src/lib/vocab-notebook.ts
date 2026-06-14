"use client";
import { userKey } from "./user-store";

export interface NotebookWord {
  id: string;
  word: string;
  meaning: string;
  note?: string;
  tags: string[];
  createdAt: string;
}

const NB_KEY = "learnos_vocab_notebook";

function getStorageKey(): string {
  return userKey(NB_KEY);
}

export function getNotebookWords(): NotebookWord[] {
  try {
    const raw = localStorage.getItem(getStorageKey());
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addNotebookWord(word: string, meaning: string, tags: string[] = [], note?: string): NotebookWord {
  const entry: NotebookWord = {
    id: "nb-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 5),
    word: word.trim(),
    meaning: meaning.trim(),
    note: note?.trim() || "",
    tags,
    createdAt: new Date().toISOString(),
  };
  const words = getNotebookWords();
  words.unshift(entry);
  localStorage.setItem(getStorageKey(), JSON.stringify(words));
  return entry;
}

export function removeNotebookWord(id: string): void {
  const words = getNotebookWords().filter(w => w.id !== id);
  localStorage.setItem(getStorageKey(), JSON.stringify(words));
}

export function updateNotebookWord(id: string, updates: Partial<Pick<NotebookWord, "word" | "meaning" | "note" | "tags">>): void {
  const words = getNotebookWords();
  const idx = words.findIndex(w => w.id === id);
  if (idx >= 0) {
    words[idx] = { ...words[idx], ...updates };
    localStorage.setItem(getStorageKey(), JSON.stringify(words));
  }
}

export function searchNotebookWords(query: string): NotebookWord[] {
  const q = query.toLowerCase();
  return getNotebookWords().filter(w =>
    w.word.toLowerCase().includes(q) || w.meaning.includes(q) ||
    (w.note && w.note.includes(q)) || w.tags.some(t => t.includes(q))
  );
}
