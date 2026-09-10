import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { PipelineStage } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { stage } = body as { stage: PipelineStage };

    if (!stage) {
      return NextResponse.json({ error: "Stage is required" }, { status: 400 });
    }

    const updated = db.updateOpportunityStage(id, stage);
    if (!updated) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({ opportunity: updated });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to update stage" }, { status: 500 });
  }
}
