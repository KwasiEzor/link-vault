import { NextRequest, NextResponse } from "next/server";
import { getMetadata } from "@/lib/metadata";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const metadata = await getMetadata(url);
    if (!metadata) {
      return NextResponse.json({ error: "Could not fetch metadata" }, { status: 404 });
    }
    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
