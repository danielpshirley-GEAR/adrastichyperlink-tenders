import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  try {
    const frameworks = db.getFrameworks();
    return NextResponse.json({ frameworks });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch frameworks" }, { status: 500 });
  }
}
