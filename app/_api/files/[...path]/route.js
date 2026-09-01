import { NextResponse } from "next/server";
import { readLocalUpload } from "@/lib/files";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const parts = await params;
  const [projectId, ...rest] = parts.path || [];
  if (!projectId || !rest.length) {
    return new NextResponse("Arquivo não encontrado", { status: 404 });
  }

  try {
    const filename = decodeURIComponent(rest.join("/"));
    const file = await readLocalUpload(projectId, filename);
    return new NextResponse(file.buffer, {
      headers: { "content-type": file.contentType, "cache-control": "public, max-age=3600" },
    });
  } catch {
    return new NextResponse("Arquivo não encontrado", { status: 404 });
  }
}

