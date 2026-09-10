import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  try {
    const readinessChecks = db.getReadinessChecks();
    return NextResponse.json({ readinessChecks });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch readiness checks" }, { status: 500 });
  }
}
