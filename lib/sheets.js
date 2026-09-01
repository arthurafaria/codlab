import { google } from "googleapis";
import { OUTPUT_FIXED_COLUMNS } from "./constants";

function configured() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY,
  );
}

function client() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export function buildOutputHeaders(variables) {
  return [
    ...OUTPUT_FIXED_COLUMNS,
    ...variables
      .slice()
      .sort((a, b) => a.outputOrder - b.outputOrder)
      .map((variable) => variable.key),
  ];
}

export function buildOutputRow({ project, link, item, response, variables }) {
  const values = response.values || {};
  return buildOutputHeaders(variables).map((header) => {
    if (header === "project_id") return project.id;
    if (header === "coder_label") return link.coderLabel;
    if (header === "item_id") return item.itemId;
    if (header === "image_filename") return item.imageFilename;
    if (header === "status") return response.status;
    if (header === "submitted_at") return response.submittedAt || "";
    const value = values[header];
    return Array.isArray(value) ? value.join("|") : value ?? "";
  });
}

export async function appendResponseToSheet({ project, link, item, response, variables }) {
  if (!project.spreadsheetId) {
    return { status: "waiting_config", error: "Projeto sem spreadsheet_id." };
  }
  if (!configured()) {
    return { status: "waiting_config", error: "Service account do Google Sheets não configurada." };
  }

  const sheets = client();
  const sheetName = project.sheetName || "responses";
  const headers = buildOutputHeaders(variables);
  const row = buildOutputRow({ project, link, item, response, variables });

  const firstRow = await sheets.spreadsheets.values.get({
    spreadsheetId: project.spreadsheetId,
    range: `${sheetName}!A1:ZZ1`,
  }).catch(async (error) => {
    if (error?.code !== 400) throw error;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: project.spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    });
    return { data: { values: [] } };
  });

  if (!firstRow.data.values?.[0]?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: project.spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers] },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: project.spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  return { status: "synced", error: "" };
}

