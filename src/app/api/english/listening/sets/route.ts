import { NextResponse } from "next/server";
import { getAvailableLevels, getCET4Template, getCET6Template } from "@/data/listening-sets";

export async function GET() {
  const levels = getAvailableLevels();
  const cet4 = getCET4Template();
  const cet6 = getCET6Template();

  return NextResponse.json({
    levels,
    templates: {
      cet4: {
        totalQuestions: cet4.totalQuestions,
        sections: cet4.sections.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          passages: s.passageConfigs,
        })),
      },
      cet6: {
        totalQuestions: cet6.totalQuestions,
        sections: cet6.sections.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          passages: s.passageConfigs,
        })),
      },
    },
  });
}
