import { NextResponse } from "next/server";
import { createProjectPackage } from "@/lib/db";
import { extractImages, readCodebook, storeImages } from "@/lib/files";
import { parseTemplateCsv, parseTemplateWorkbook, parseVariablesFromCodebook, validateItems, validateVariables } from "@/lib/template";
import { DEFAULT_SHEET_NAME } from "@/lib/constants";

export const runtime = "nodejs";

function filePresent(file) {
  return file && typeof file === "object" && file.size > 0;
}

async function textFile(file) {
  if (!filePresent(file)) return "";
  return Buffer.from(await file.arrayBuffer()).toString("utf8");
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const title = String(formData.get("title") || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Informe o título do projeto." }, { status: 400 });
    }

    const spreadsheetFile = formData.get("spreadsheetFile");
    const itemsCsv = formData.get("itemsCsv");
    const variablesCsv = formData.get("variablesCsv");
    const imageZip = formData.get("imageZip");
    const imageFiles = formData.getAll("imageFiles");
    const codebookFile = formData.get("codebookFile");
    const codebookMarkdown = await readCodebook(codebookFile);
    const coderLabels = String(formData.get("coderLabels") || "")
      .split(/\r?\n/)
      .map((label) => label.trim())
      .filter(Boolean);

    const images = await extractImages({ zipFile: filePresent(imageZip) ? imageZip : null, imageFiles });
    if (!images.length) {
      return NextResponse.json({ error: "Envie pelo menos uma imagem PNG, JPG ou WebP." }, { status: 400 });
    }

    let parsed;
    if (filePresent(spreadsheetFile)) {
      parsed = parseTemplateWorkbook(Buffer.from(await spreadsheetFile.arrayBuffer()), {
        imageFilenames: images.map((image) => image.filename),
      });
    } else if (filePresent(itemsCsv) && filePresent(variablesCsv)) {
      parsed = parseTemplateCsv({
        itemsText: await textFile(itemsCsv),
        variablesText: await textFile(variablesCsv),
        settingsText: await textFile(formData.get("settingsCsv")),
        codersText: await textFile(formData.get("codersCsv")),
      });
    } else {
      return NextResponse.json(
        { error: "Envie o template .xlsx ou os CSVs items.csv e variables.csv." },
        { status: 400 },
      );
    }

    if (parsed.items.length === 0) {
      parsed.items = images.map((image, index) => ({
        itemId: String(index + 1).padStart(3, "0"),
        imageFilename: image.filename,
        metadata: { image_filename: image.filename },
        sortOrder: index + 1,
      }));
    }
    if (parsed.variables.length === 0 && codebookMarkdown) {
      parsed.variables = parseVariablesFromCodebook(codebookMarkdown);
    }

    const imageErrors = validateItems(parsed.items, images.map((image) => image.filename));
    const variableErrors = validateVariables(parsed.variables);
    const structuralErrors = [];
    if (parsed.variables.length === 0) {
      structuralErrors.push("O template precisa ter ao menos uma variável na aba variables.");
    }
    if (parsed.items.length === 0) {
      structuralErrors.push("O projeto precisa ter ao menos uma imagem atribuível.");
    }
    const errors = [...structuralErrors, ...imageErrors, ...variableErrors];
    if (errors.length) {
      return NextResponse.json({ error: "Corrija o pacote antes de publicar.", errors }, { status: 400 });
    }

    const projectId = crypto.randomUUID();
    const storedImages = await storeImages(projectId, images);
    const urlByFilename = new Map(storedImages.map((image) => [image.filename.toLowerCase(), image.url]));

    const created = await createProjectPackage({
      id: projectId,
      title,
      description: String(formData.get("description") || ""),
      language: String(formData.get("language") || "pt-BR"),
      instructions: String(formData.get("instructions") || ""),
      responsibleName: String(formData.get("responsibleName") || ""),
      spreadsheetId: String(formData.get("spreadsheetId") || ""),
      sheetName: String(formData.get("sheetName") || DEFAULT_SHEET_NAME),
      codebookMarkdown,
      settings: parsed.settings,
      items: parsed.items.map((item) => ({
        ...item,
        projectId,
        imageUrl: urlByFilename.get(item.imageFilename.toLowerCase()),
      })),
      variables: parsed.variables,
      coders: coderLabels.length
        ? coderLabels.map((coderLabel) => ({ coderLabel, emailOptional: "", quotaOptional: null }))
        : parsed.coders,
    });

    return NextResponse.json({
      project: created.project,
      adminUrl: `/admin/${created.project.adminToken}`,
      coderUrls: created.coderLinks.map((link) => ({
        coderLabel: link.coderLabel,
        url: `/code/${link.token}`,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Falha ao criar projeto." }, { status: 500 });
  }
}
