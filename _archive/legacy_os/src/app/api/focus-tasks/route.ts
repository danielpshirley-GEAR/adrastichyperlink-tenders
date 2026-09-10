import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET() {
  try {
    const focusTasks = db.getFocusTasks();
    const dailyWorkItems = db.getDailyWorkItems();
    return NextResponse.json({ focusTasks, dailyWorkItems });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch focus tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId } = body as { taskId: string };
    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }
    const updated = db.completeFocusTask(taskId);
    return NextResponse.json({ focusTasks: updated });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
