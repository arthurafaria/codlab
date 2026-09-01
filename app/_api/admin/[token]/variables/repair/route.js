import { NextResponse } from "next/server";
import { addProjectVariablesFromCodebook, getProjectByAdminToken } from "@/lib/db";
import { parseVariablesFromCodebook, validateVariables } from "@/lib/template";

export const runtime = "nodejs";

export async function POST(_request, { params }) {
  try {
    const { token } = await params;
    const data = await getProjectByAdminToken(token);
    if (!data) {
      return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });
    }

    const variables = parseVariablesFromCodebook(data.project.codebookMarkdown || "");
    const errors = validateVariables(variables);
    if (errors.length) {
      return NextResponse.json({ error: "O livro de códigos gerou variáveis inválidas.", errors }, { status: 400 });
    }

    const saved = await addProjectVariablesFromCodebook(token, variables);
    return NextResponse.json({ variables: saved });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Falha ao reparar variáveis." }, { status: 400 });
  }
}
