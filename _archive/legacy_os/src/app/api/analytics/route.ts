import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  try {
    const analytics = db.getAnalytics();
    return NextResponse.json({ analytics });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
