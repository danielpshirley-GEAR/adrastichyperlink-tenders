import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  try {
    const clients = db.getClients();
    return NextResponse.json({ clients });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}
