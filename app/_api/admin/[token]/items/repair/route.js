import { NextResponse } from "next/server";
import { addProjectItemsFromStoredImages, getProjectByAdminToken } from "@/lib/db";
import { listStoredImages } from "@/lib/files";

export const runtime = "nodejs";

export async function POST(_request, { params }) {
  try {
    const { token } = await params;
    const data = await getProjectByAdminToken(token);
    if (!data) {
      return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
    }
    const storedImages = await listStoredImages(data.project.id);
    const items = await addProjectItemsFromStoredImages(token, storedImages);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Falha ao reparar imagens." }, { status: 400 });
  }
}
