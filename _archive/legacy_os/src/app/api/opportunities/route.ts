import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const engine = searchParams.get("engine");
    const stage = searchParams.get("stage");
    const sort = searchParams.get("sort") || "actionScore"; // default sort by Action Score

    let opps = db.getOpportunities();

    if (engine) {
      opps = opps.filter((o) => o.acquisitionEngine === engine);
    }
    if (stage) {
      opps = opps.filter((o) => o.pipelineStage === stage);
    }

    // Sorting
    if (sort === "actionScore") {
      opps.sort((a, b) => b.actionScore - a.actionScore);
    } else if (sort === "leadScore") {
      opps.sort((a, b) => b.leadScore - a.leadScore);
    } else if (sort === "value") {
      opps.sort((a, b) => b.estimatedValueGbp - a.estimatedValueGbp);
    }

    return NextResponse.json({ opportunities: opps });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.companyName) {
      return NextResponse.json(
        { error: "Title and Company Name are required" },
        { status: 400 }
      );
    }

    const created = db.createOpportunity(body);
    return NextResponse.json({ opportunity: created }, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 });
  }
}
