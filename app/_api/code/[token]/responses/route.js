import { NextResponse } from "next/server";
import { getResponseContext, saveCoderResponse, upsertSyncJob } from "@/lib/db";
import { appendResponseToSheet } from "@/lib/sheets";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const body = await request.json();
    const result = await saveCoderResponse({
      coderToken: token,
      itemId: String(body.itemId || ""),
      values: body.values || {},
      status: body.status === "submitted" ? "submitted" : "draft",
    });

    if (result.response.status === "submitted") {
      await upsertSyncJob(result.response.id, { status: "pending" });
      const context = await getResponseContext(result.response.id);
      try {
        const syncResult = await appendResponseToSheet(context);
        await upsertSyncJob(result.response.id, {
          status: syncResult.status,
          error: syncResult.error || "",
          incrementAttempts: syncResult.status !== "waiting_config",
        });
      } catch (error) {
        await upsertSyncJob(result.response.id, {
          status: "failed",
          error: error.message || "Falha ao sincronizar com Google Sheets.",
          incrementAttempts: true,
        });
      }
    }

    return NextResponse.json({ response: result.response });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Falha ao salvar resposta." }, { status: 400 });
  }
}

