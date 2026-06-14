import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    // Follow the b23.tv redirect
    const resp = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    // Extract BV ID from final URL
    const finalUrl = resp.url;
    const bvMatch = finalUrl.match(/BV[a-zA-Z0-9]{10}/);
    
    if (bvMatch) {
      return NextResponse.json({ bvid: bvMatch[0], resolvedUrl: finalUrl });
    }
    
    return NextResponse.json({ error: "No BV ID found", finalUrl }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
