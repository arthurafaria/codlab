import { NextResponse } from "next/server";
import { createProjectPackage } from "@/lib/db";
import { buildIaRacialExamplePackage } from "@/lib/ia-racial-example";

export const runtime = "nodejs";

export async function POST() {
  try {
    const created = await createProjectPackage(buildIaRacialExamplePackage());

    return NextResponse.json({
      project: created.project,
      adminUrl: `/admin/${created.project.adminToken}`,
      coderUrls: created.coderLinks.map((link) => ({
        coderLabel: link.coderLabel,
        url: `/code/${link.token}`,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Falha ao criar projeto exemplo." },
      { status: 500 },
    );
  }
}
