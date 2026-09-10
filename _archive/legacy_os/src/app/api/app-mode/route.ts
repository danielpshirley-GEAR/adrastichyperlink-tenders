import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { AppMode } from "@/lib/types";

export async function GET() {
  try {
    const appMode = db.getAppMode();
    return NextResponse.json({ appMode });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch app mode" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode } = body as { mode: AppMode };
    if (!mode || (mode !== "demo" && mode !== "live")) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }
    const updatedMode = db.setAppMode(mode);
    return NextResponse.json({ appMode: updatedMode });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to update app mode" }, { status: 500 });
  }
}
