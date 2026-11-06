import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Chýba URL adresa obrázka." }, { status: 400 });
    }

    // Basic protocol validation
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return NextResponse.json({ error: "Neplatná URL adresa." }, { status: 400 });
    }

    const res = await fetch(url, {
      signal: AbortSignal.timeout(2500),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Nepodarilo sa stiahnuť obrázok (HTTP ${res.status}).` },
        { status: 400 }
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/") && !contentType.includes("octet-stream")) {
      return NextResponse.json(
        { error: "Zadaná adresa neobsahuje platný obrázok." },
        { status: 400 }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      dataUrl,
      contentType,
      sizeBytes: buffer.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[fetch-remote-image] error:", errorMsg);
    return NextResponse.json(
      { error: "Chyba pri sťahovaní obrázka zo vzdialeného servera." },
      { status: 500 }
    );
  }
}
