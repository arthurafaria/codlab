import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getProjectByAdminToken } from "@/lib/db";
import { buildOutputHeaders, buildOutputRow } from "@/lib/sheets";
import { toCsv, toTsv } from "@/lib/csv";

export const runtime = "nodejs";

function outputRows(data) {
  const headers = buildOutputHeaders(data.variables);
  const links = new Map(data.coderLinks.map((link) => [link.id, link]));
  const items = new Map(data.items.map((item) => [item.itemId, item]));
  const submitted = data.responses
    .filter((response) => response.status === "submitted")
    .sort((a, b) => String(a.submittedAt).localeCompare(String(b.submittedAt)));

  return [
    headers,
    ...submitted.map((response) =>
      buildOutputRow({
        project: data.project,
        link: links.get(response.coderLinkId),
        item: items.get(response.itemId),
        response,
        variables: data.variables,
      }),
    ),
  ];
}

export async function GET(request, { params }) {
  const { token } = await params;
  const data = await getProjectByAdminToken(token);
  if (!data) return new NextResponse("Projeto não encontrado", { status: 404 });

  const format = new URL(request.url).searchParams.get("format") || "csv";
  const rows = outputRows(data);

  if (format === "xlsx") {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), data.project.sheetName || "responses");
    return new NextResponse(XLSX.write(book, { type: "buffer", bookType: "xlsx" }), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${data.project.id}-respostas.xlsx"`,
      },
    });
  }

  if (format === "tsv") {
    return new NextResponse(toTsv(rows.slice(1)), {
      headers: {
        "content-type": "text/tab-separated-values; charset=utf-8",
        "content-disposition": `inline; filename="${data.project.id}-valores.tsv"`,
      },
    });
  }

  return new NextResponse(`\ufeff${toCsv(rows)}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${data.project.id}-respostas.csv"`,
    },
  });
}

