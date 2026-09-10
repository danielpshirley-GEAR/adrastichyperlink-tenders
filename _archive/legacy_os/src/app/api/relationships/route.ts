import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  try {
    const relationships = db.getRelationships();
    return NextResponse.json({ relationships });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch relationships" }, { status: 500 });
  }
}
