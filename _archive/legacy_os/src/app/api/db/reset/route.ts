import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function POST() {
  try {
    const state = db.resetToDefaults();
    return NextResponse.json({ success: true, state });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to reset database" }, { status: 500 });
  }
}
