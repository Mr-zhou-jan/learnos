import { ChapterContent } from "./types";
import ch01 from "./chapter01-函数与极限";
import ch02 from "./chapter02-导数与微分";
import ch03 from "./chapter03-中值定理";
import ch04 from "./chapter04-不定积分";
import ch05 from "./chapter05-定积分";
import ch06 from "./chapter06-微分方程";

const chapters: Record<string, ChapterContent> = {
  "函数与极限": ch01,
  "导数与微分": ch02,
  "中值定理与导数应用": ch03,
  "不定积分": ch04,
  "定积分": ch05,
  "微分方程": ch06,
};

export function getChapterContent(chapterName: string): ChapterContent | null {
  for (const [key, content] of Object.entries(chapters)) {
    if (chapterName.includes(key) || key.includes(chapterName)) return content;
  }
  return null;
}

export function getChapterList(subject: string) {
  if (subject.includes("高等数学") || subject.includes("高数")) {
    return Object.entries(chapters).map(([name, c]) => ({
      name, weight: c.examWeight, score: c.examScore,
    }));
  }
  return [];
}

export { chapters };
export type { ChapterContent };
