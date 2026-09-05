import { NextResponse } from "next/server";
import { createTemplateWorkbook } from "@/lib/archived/template";

export const runtime = "nodejs";

export async function GET() {
  return new NextResponse(createTemplateWorkbook(), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": 'attachment; filename="template-codificacao-imagens.xlsx"',
    },
  });
}

