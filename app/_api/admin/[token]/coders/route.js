import { NextResponse } from "next/server";
import { createCoderLink, updateCoderLink } from "@/lib/db";

export const runtime = "nodejs";

function cleanQuota(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const body = await request.json();
    const link = await createCoderLink(token, {
      coderLabel: String(body.coderLabel || "").trim(),
      emailOptional: String(body.emailOptional || "").trim(),
      quotaOptional: cleanQuota(body.quotaOptional),
    });
    return NextResponse.json({ link });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Falha ao criar codificador." }, { status: 400 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { token } = await params;
    const body = await request.json();
    const link = await updateCoderLink(token, String(body.id || ""), {
      coderLabel: String(body.coderLabel || "").trim(),
      emailOptional: String(body.emailOptional || "").trim(),
      quotaOptional: cleanQuota(body.quotaOptional),
      status: body.status === "inactive" ? "inactive" : "active",
    });
    return NextResponse.json({ link });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Falha ao atualizar codificador." }, { status: 400 });
  }
}

