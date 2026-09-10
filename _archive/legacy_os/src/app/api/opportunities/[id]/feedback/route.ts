import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { LeadFeedback } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { feedback } = body as { feedback: LeadFeedback };

    if (!feedback) {
      return NextResponse.json({ error: "Feedback is required" }, { status: 400 });
    }

    const updated = db.saveOpportunityFeedback(id, feedback);
    if (!updated) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({ opportunity: updated });
  } catch (error) {
    console.error("API Error in feedback route:", error);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
