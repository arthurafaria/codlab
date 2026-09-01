import fs from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { DEFAULT_SHEET_NAME } from "./constants";

const localDbPath = path.join(process.cwd(), ".local-data", "db.json");

let sqlClient = null;
let schemaReady = false;

function now() {
  return new Date().toISOString();
}

function token(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function usingPostgres() {
  return Boolean(process.env.DATABASE_URL);
}

function getSql() {
  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
}

async function ensureSchema() {
  if (!usingPostgres() || schemaReady) return;
  const sql = getSql();
  await sql`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    admin_token TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    language TEXT DEFAULT 'pt-BR',
    instructions TEXT DEFAULT '',
    responsible_name TEXT DEFAULT '',
    codebook_markdown TEXT DEFAULT '',
    spreadsheet_id TEXT DEFAULT '',
    sheet_name TEXT DEFAULT 'responses',
    status TEXT NOT NULL DEFAULT 'draft',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS project_items (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    image_filename TEXT NOT NULL,
    image_url TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    sort_order INTEGER NOT NULL,
    PRIMARY KEY (project_id, item_id)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS project_variables (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL,
    group_name TEXT NOT NULL,
    required BOOLEAN NOT NULL DEFAULT false,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    help TEXT DEFAULT '',
    default_value TEXT DEFAULT '',
    output_order INTEGER NOT NULL,
    PRIMARY KEY (project_id, key)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS coder_links (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    coder_label TEXT NOT NULL,
    email_optional TEXT DEFAULT '',
    quota_optional INTEGER,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    coder_link_id TEXT NOT NULL REFERENCES coder_links(id) ON DELETE CASCADE,
    values JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (project_id, item_id, coder_link_id)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS sheet_sync_jobs (
    id TEXT PRIMARY KEY,
    response_id TEXT NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    error TEXT DEFAULT '',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS sheet_sync_jobs_response_id_key ON sheet_sync_jobs (response_id)`;
  schemaReady = true;
}

async function readLocal() {
  try {
    return JSON.parse(await fs.readFile(localDbPath, "utf8"));
  } catch {
    return {
      projects: [],
      items: [],
      variables: [],
      coderLinks: [],
      responses: [],
      sheetSyncJobs: [],
    };
  }
}

async function writeLocal(db) {
  await fs.mkdir(path.dirname(localDbPath), { recursive: true });
  await fs.writeFile(localDbPath, JSON.stringify(db, null, 2), "utf8");
}

function mapProject(row) {
  return {
    id: row.id,
    adminToken: row.admin_token ?? row.adminToken,
    title: row.title,
    description: row.description || "",
    language: row.language || "pt-BR",
    instructions: row.instructions || "",
    responsibleName: row.responsible_name ?? row.responsibleName ?? "",
    codebookMarkdown: row.codebook_markdown ?? row.codebookMarkdown ?? "",
    spreadsheetId: row.spreadsheet_id ?? row.spreadsheetId ?? "",
    sheetName: row.sheet_name ?? row.sheetName ?? DEFAULT_SHEET_NAME,
    status: row.status,
    settings: row.settings || {},
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

function mapItem(row) {
  return {
    projectId: row.project_id ?? row.projectId,
    itemId: row.item_id ?? row.itemId,
    imageFilename: row.image_filename ?? row.imageFilename,
    imageUrl: row.image_url ?? row.imageUrl,
    metadata: row.metadata || {},
    sortOrder: row.sort_order ?? row.sortOrder,
  };
}

function mapVariable(row) {
  return {
    projectId: row.project_id ?? row.projectId,
    key: row.key,
    label: row.label,
    type: row.type,
    group: row.group_name ?? row.group,
    required: Boolean(row.required),
    options: row.options || [],
    help: row.help || "",
    defaultValue: row.default_value ?? row.defaultValue ?? "",
    outputOrder: row.output_order ?? row.outputOrder,
  };
}

function mapCoderLink(row) {
  return {
    id: row.id,
    projectId: row.project_id ?? row.projectId,
    token: row.token,
    coderLabel: row.coder_label ?? row.coderLabel,
    emailOptional: row.email_optional ?? row.emailOptional ?? "",
    quotaOptional: row.quota_optional ?? row.quotaOptional ?? null,
    status: row.status,
    createdAt: row.created_at ?? row.createdAt,
  };
}

function mapResponse(row) {
  return {
    id: row.id,
    projectId: row.project_id ?? row.projectId,
    itemId: row.item_id ?? row.itemId,
    coderLinkId: row.coder_link_id ?? row.coderLinkId,
    values: row.values || {},
    status: row.status,
    submittedAt: row.submitted_at ?? row.submittedAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

function mapSyncJob(row) {
  return {
    id: row.id,
    responseId: row.response_id ?? row.responseId,
    status: row.status,
    error: row.error || "",
    attempts: row.attempts || 0,
    lastSyncedAt: row.last_synced_at ?? row.lastSyncedAt ?? null,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

export function assignedItemsForLink(items, coderLinks, link, settings = {}) {
  const mode = settings.assignment_mode || settings.assignmentMode || "all_code_all";
  const orderedLinks = coderLinks.slice().sort((a, b) => a.coderLabel.localeCompare(b.coderLabel));
  const coderIndex = Math.max(0, orderedLinks.findIndex((entry) => entry.id === link.id));
  const coderCount = Math.max(1, orderedLinks.length);
  const overlapPercent = Number(settings.overlap_percent || settings.overlapPercent || 0);
  const overlapCount = Math.ceil(items.length * Math.max(0, Math.min(100, overlapPercent)) / 100);

  let assigned = items;
  if (mode === "balanced") {
    assigned = items.filter((item, index) => index < overlapCount || index % coderCount === coderIndex);
  }

  if (link.quotaOptional) {
    assigned = assigned.slice(0, link.quotaOptional);
  }
  return assigned;
}

export async function createProjectPackage(input) {
  const project = {
    id: input.id || crypto.randomUUID(),
    adminToken: token("admin"),
    title: input.title,
    description: input.description || "",
    language: input.language || "pt-BR",
    instructions: input.instructions || "",
    responsibleName: input.responsibleName || "",
    codebookMarkdown: input.codebookMarkdown || "",
    spreadsheetId: input.spreadsheetId || "",
    sheetName: input.sheetName || DEFAULT_SHEET_NAME,
    status: "published",
    settings: input.settings || {},
    createdAt: now(),
    updatedAt: now(),
  };
  const items = input.items.map((item) => ({ ...item, projectId: project.id }));
  const variables = input.variables.map((variable) => ({ ...variable, projectId: project.id }));
  const coderLinks = input.coders.map((coder) => ({
    id: crypto.randomUUID(),
    projectId: project.id,
    token: token("coder"),
    coderLabel: coder.coderLabel,
    emailOptional: coder.emailOptional || "",
    quotaOptional: coder.quotaOptional || null,
    status: "active",
    createdAt: now(),
  }));

  if (usingPostgres()) {
    await ensureSchema();
    const sql = getSql();
    await sql`INSERT INTO projects (
      id, admin_token, title, description, language, instructions, responsible_name,
      codebook_markdown, spreadsheet_id, sheet_name, status, settings, created_at, updated_at
    ) VALUES (
      ${project.id}, ${project.adminToken}, ${project.title}, ${project.description}, ${project.language},
      ${project.instructions}, ${project.responsibleName}, ${project.codebookMarkdown},
      ${project.spreadsheetId}, ${project.sheetName}, ${project.status}, ${JSON.stringify(project.settings)}::jsonb,
      ${project.createdAt}, ${project.updatedAt}
    )`;
    for (const item of items) {
      await sql`INSERT INTO project_items (
        project_id, item_id, image_filename, image_url, metadata, sort_order
      ) VALUES (
        ${item.projectId}, ${item.itemId}, ${item.imageFilename}, ${item.imageUrl},
        ${JSON.stringify(item.metadata)}::jsonb, ${item.sortOrder}
      )`;
    }
    for (const variable of variables) {
      await sql`INSERT INTO project_variables (
        project_id, key, label, type, group_name, required, options, help, default_value, output_order
      ) VALUES (
        ${variable.projectId}, ${variable.key}, ${variable.label}, ${variable.type}, ${variable.group},
        ${variable.required}, ${JSON.stringify(variable.options)}::jsonb, ${variable.help},
        ${variable.defaultValue}, ${variable.outputOrder}
      )`;
    }
    for (const link of coderLinks) {
      await sql`INSERT INTO coder_links (
        id, project_id, token, coder_label, email_optional, quota_optional, status, created_at
      ) VALUES (
        ${link.id}, ${link.projectId}, ${link.token}, ${link.coderLabel}, ${link.emailOptional},
        ${link.quotaOptional}, ${link.status}, ${link.createdAt}
      )`;
    }
  } else {
    const db = await readLocal();
    db.projects.push(project);
    db.items.push(...items);
    db.variables.push(...variables);
    db.coderLinks.push(...coderLinks);
    await writeLocal(db);
  }

  return getProjectByAdminToken(project.adminToken);
}

export async function createCoderLink(adminToken, input) {
  const data = await getProjectByAdminToken(adminToken);
  if (!data) throw new Error("Projeto não encontrado.");
  const link = {
    id: crypto.randomUUID(),
    projectId: data.project.id,
    token: token("coder"),
    coderLabel: input.coderLabel || `Codificador ${data.coderLinks.length + 1}`,
    emailOptional: input.emailOptional || "",
    quotaOptional: input.quotaOptional || null,
    status: "active",
    createdAt: now(),
  };

  if (usingPostgres()) {
    await ensureSchema();
    const sql = getSql();
    await sql`INSERT INTO coder_links (
      id, project_id, token, coder_label, email_optional, quota_optional, status, created_at
    ) VALUES (
      ${link.id}, ${link.projectId}, ${link.token}, ${link.coderLabel}, ${link.emailOptional},
      ${link.quotaOptional}, ${link.status}, ${link.createdAt}
    )`;
  } else {
    const db = await readLocal();
    db.coderLinks.push(link);
    await writeLocal(db);
  }

  return link;
}

export async function updateCoderLink(adminToken, coderLinkId, patch) {
  const data = await getProjectByAdminToken(adminToken);
  if (!data) throw new Error("Projeto não encontrado.");
  const current = data.coderLinks.find((link) => link.id === coderLinkId);
  if (!current) throw new Error("Codificador não encontrado.");

  const next = {
    ...current,
    coderLabel: patch.coderLabel || current.coderLabel,
    emailOptional: patch.emailOptional ?? current.emailOptional,
    quotaOptional: patch.quotaOptional === "" ? null : patch.quotaOptional ?? current.quotaOptional,
    status: patch.status || current.status,
  };

  if (usingPostgres()) {
    await ensureSchema();
    const sql = getSql();
    await sql`UPDATE coder_links SET
      coder_label = ${next.coderLabel},
      email_optional = ${next.emailOptional},
      quota_optional = ${next.quotaOptional},
      status = ${next.status}
      WHERE id = ${coderLinkId} AND project_id = ${data.project.id}`;
  } else {
    const db = await readLocal();
    const index = db.coderLinks.findIndex((link) => link.id === coderLinkId && link.projectId === data.project.id);
    if (index === -1) throw new Error("Codificador não encontrado.");
    db.coderLinks[index] = next;
    await writeLocal(db);
  }

  return next;
}

export async function addProjectItemsFromStoredImages(adminToken, storedItems) {
  const data = await getProjectByAdminToken(adminToken);
  if (!data) throw new Error("Projeto não encontrado.");
  if (data.items.length > 0) throw new Error("Este projeto já tem imagens cadastradas.");
  if (!storedItems.length) throw new Error("Nenhuma imagem armazenada foi encontrada para reparar o projeto.");

  const items = storedItems.map((item, index) => ({
    projectId: data.project.id,
    itemId: item.itemId || String(index + 1).padStart(3, "0"),
    imageFilename: item.imageFilename,
    imageUrl: item.imageUrl,
    metadata: item.metadata || { image_filename: item.imageFilename },
    sortOrder: item.sortOrder || index + 1,
  }));

  if (usingPostgres()) {
    await ensureSchema();
    const sql = getSql();
    for (const item of items) {
      await sql`INSERT INTO project_items (
        project_id, item_id, image_filename, image_url, metadata, sort_order
      ) VALUES (
        ${item.projectId}, ${item.itemId}, ${item.imageFilename}, ${item.imageUrl},
        ${JSON.stringify(item.metadata)}::jsonb, ${item.sortOrder}
      )`;
    }
  } else {
    const db = await readLocal();
    db.items.push(...items);
    await writeLocal(db);
  }

  return items;
}

export async function addProjectVariablesFromCodebook(adminToken, variables) {
  const data = await getProjectByAdminToken(adminToken);
  if (!data) throw new Error("Projeto não encontrado.");
  if (data.variables.length > 0) throw new Error("Este projeto já tem variáveis cadastradas.");
  if (!variables.length) throw new Error("Nenhuma variável foi encontrada no livro de códigos.");

  const rows = variables.map((variable, index) => ({
    ...variable,
    projectId: data.project.id,
    outputOrder: variable.outputOrder || index + 1,
  }));

  if (usingPostgres()) {
    await ensureSchema();
    const sql = getSql();
    for (const variable of rows) {
      await sql`INSERT INTO project_variables (
        project_id, key, label, type, group_name, required, options, help, default_value, output_order
      ) VALUES (
        ${variable.projectId}, ${variable.key}, ${variable.label}, ${variable.type}, ${variable.group},
        ${variable.required}, ${JSON.stringify(variable.options)}::jsonb, ${variable.help},
        ${variable.defaultValue}, ${variable.outputOrder}
      )`;
    }
  } else {
    const db = await readLocal();
    db.variables.push(...rows);
    await writeLocal(db);
  }

  return rows;
}

export async function getProjectByAdminToken(adminToken) {
  if (usingPostgres()) {
    await ensureSchema();
    const sql = getSql();
    const [projectRow] = await sql`SELECT * FROM projects WHERE admin_token = ${adminToken}`;
    if (!projectRow) return null;
    const project = mapProject(projectRow);
    const [items, variables, coderLinks, responses, syncJobs] = await Promise.all([
      sql`SELECT * FROM project_items WHERE project_id = ${project.id} ORDER BY sort_order ASC`,
      sql`SELECT * FROM project_variables WHERE project_id = ${project.id} ORDER BY output_order ASC`,
      sql`SELECT * FROM coder_links WHERE project_id = ${project.id} ORDER BY created_at ASC`,
      sql`SELECT * FROM responses WHERE project_id = ${project.id} ORDER BY updated_at DESC`,
      sql`SELECT sj.* FROM sheet_sync_jobs sj JOIN responses r ON r.id = sj.response_id WHERE r.project_id = ${project.id} ORDER BY sj.updated_at DESC`,
    ]);
    return {
      project,
      items: items.map(mapItem),
      variables: variables.map(mapVariable),
      coderLinks: coderLinks.map(mapCoderLink),
      responses: responses.map(mapResponse),
      syncJobs: syncJobs.map(mapSyncJob),
    };
  }

  const db = await readLocal();
  const project = db.projects.find((entry) => entry.adminToken === adminToken);
  if (!project) return null;
  return {
    project: clone(project),
    items: db.items.filter((entry) => entry.projectId === project.id).sort((a, b) => a.sortOrder - b.sortOrder),
    variables: db.variables.filter((entry) => entry.projectId === project.id).sort((a, b) => a.outputOrder - b.outputOrder),
    coderLinks: db.coderLinks.filter((entry) => entry.projectId === project.id),
    responses: db.responses.filter((entry) => entry.projectId === project.id),
    syncJobs: db.sheetSyncJobs.filter((job) => db.responses.some((response) => response.id === job.responseId && response.projectId === project.id)),
  };
}

export async function getCoderProject(coderToken) {
  if (usingPostgres()) {
    await ensureSchema();
    const sql = getSql();
    const [linkRow] = await sql`SELECT * FROM coder_links WHERE token = ${coderToken} AND status = 'active'`;
    if (!linkRow) return null;
    const link = mapCoderLink(linkRow);
    const [projectRow] = await sql`SELECT * FROM projects WHERE id = ${link.projectId} AND status = 'published'`;
    if (!projectRow) return null;
    const project = mapProject(projectRow);
    const [itemsRows, variables, responses, coderLinksRows] = await Promise.all([
      sql`SELECT * FROM project_items WHERE project_id = ${project.id} ORDER BY sort_order ASC`,
      sql`SELECT * FROM project_variables WHERE project_id = ${project.id} ORDER BY output_order ASC`,
      sql`SELECT * FROM responses WHERE coder_link_id = ${link.id} ORDER BY updated_at DESC`,
      sql`SELECT * FROM coder_links WHERE project_id = ${project.id} ORDER BY created_at ASC`,
    ]);
    const items = itemsRows.map(mapItem);
    const coderLinks = coderLinksRows.map(mapCoderLink);
    return {
      project,
      link,
      totalItems: items.length,
      items: assignedItemsForLink(items, coderLinks, link, project.settings),
      variables: variables.map(mapVariable),
      responses: responses.map(mapResponse),
    };
  }

  const db = await readLocal();
  const link = db.coderLinks.find((entry) => entry.token === coderToken && entry.status === "active");
  if (!link) return null;
  const project = db.projects.find((entry) => entry.id === link.projectId && entry.status === "published");
  if (!project) return null;
  const coderLinks = db.coderLinks.filter((entry) => entry.projectId === project.id);
  const items = db.items.filter((entry) => entry.projectId === project.id).sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    project: clone(project),
    link: clone(link),
    totalItems: items.length,
    items: assignedItemsForLink(items, coderLinks, link, project.settings),
    variables: db.variables.filter((entry) => entry.projectId === project.id).sort((a, b) => a.outputOrder - b.outputOrder),
    responses: db.responses.filter((entry) => entry.coderLinkId === link.id),
  };
}

export async function saveCoderResponse({ coderToken, itemId, values, status }) {
  const savedAt = now();
  if (usingPostgres()) {
    await ensureSchema();
    const sql = getSql();
    const [linkRow] = await sql`SELECT * FROM coder_links WHERE token = ${coderToken} AND status = 'active'`;
    if (!linkRow) throw new Error("Link de codificador inválido.");
    const link = mapCoderLink(linkRow);
    const [itemRow] = await sql`SELECT * FROM project_items WHERE project_id = ${link.projectId} AND item_id = ${itemId}`;
    if (!itemRow) throw new Error("Imagem não encontrada neste projeto.");
    const existing = await sql`SELECT id FROM responses WHERE project_id = ${link.projectId} AND item_id = ${itemId} AND coder_link_id = ${link.id}`;
    const responseId = existing[0]?.id || crypto.randomUUID();
    const submittedAt = status === "submitted" ? savedAt : null;
    const [responseRow] = await sql`
      INSERT INTO responses (id, project_id, item_id, coder_link_id, values, status, submitted_at, updated_at)
      VALUES (${responseId}, ${link.projectId}, ${itemId}, ${link.id}, ${JSON.stringify(values)}::jsonb, ${status}, ${submittedAt}, ${savedAt})
      ON CONFLICT (project_id, item_id, coder_link_id)
      DO UPDATE SET values = EXCLUDED.values, status = EXCLUDED.status,
        submitted_at = COALESCE(EXCLUDED.submitted_at, responses.submitted_at),
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `;
    return { response: mapResponse(responseRow), link, item: mapItem(itemRow) };
  }

  const db = await readLocal();
  const link = db.coderLinks.find((entry) => entry.token === coderToken && entry.status === "active");
  if (!link) throw new Error("Link de codificador inválido.");
  const item = db.items.find((entry) => entry.projectId === link.projectId && entry.itemId === itemId);
  if (!item) throw new Error("Imagem não encontrada neste projeto.");
  let response = db.responses.find(
    (entry) => entry.projectId === link.projectId && entry.itemId === itemId && entry.coderLinkId === link.id,
  );
  if (!response) {
    response = {
      id: crypto.randomUUID(),
      projectId: link.projectId,
      itemId,
      coderLinkId: link.id,
      values: {},
      status: "draft",
      submittedAt: null,
      updatedAt: savedAt,
    };
    db.responses.push(response);
  }
  response.values = values;
  response.status = status;
  response.updatedAt = savedAt;
  if (status === "submitted" && !response.submittedAt) response.submittedAt = savedAt;
  await writeLocal(db);
  return { response: clone(response), link: clone(link), item: clone(item) };
}

export async function upsertSyncJob(responseId, patch) {
  if (usingPostgres()) {
    await ensureSchema();
    const sql = getSql();
    const [existing] = await sql`SELECT * FROM sheet_sync_jobs WHERE response_id = ${responseId}`;
    const id = existing?.id || crypto.randomUUID();
    const status = patch.status || existing?.status || "pending";
    const error = patch.error ?? existing?.error ?? "";
    const attempts = (existing?.attempts || 0) + (patch.incrementAttempts ? 1 : 0);
    const syncedAt = patch.status === "synced" ? now() : existing?.last_synced_at || null;
    const [row] = await sql`
      INSERT INTO sheet_sync_jobs (id, response_id, status, error, attempts, last_synced_at, created_at, updated_at)
      VALUES (${id}, ${responseId}, ${status}, ${error}, ${attempts}, ${syncedAt}, ${now()}, ${now()})
      ON CONFLICT (response_id)
      DO UPDATE SET status = EXCLUDED.status, error = EXCLUDED.error, attempts = EXCLUDED.attempts,
        last_synced_at = EXCLUDED.last_synced_at, updated_at = EXCLUDED.updated_at
      RETURNING *
    `;
    return mapSyncJob(row);
  }

  const db = await readLocal();
  let job = db.sheetSyncJobs.find((entry) => entry.responseId === responseId);
  if (!job) {
    job = {
      id: crypto.randomUUID(),
      responseId,
      status: "pending",
      error: "",
      attempts: 0,
      lastSyncedAt: null,
      createdAt: now(),
      updatedAt: now(),
    };
    db.sheetSyncJobs.push(job);
  }
  job.status = patch.status || job.status;
  job.error = patch.error ?? job.error;
  if (patch.incrementAttempts) job.attempts += 1;
  if (patch.status === "synced") job.lastSyncedAt = now();
  job.updatedAt = now();
  await writeLocal(db);
  return clone(job);
}

export async function getResponseContext(responseId) {
  if (usingPostgres()) {
    await ensureSchema();
    const sql = getSql();
    const [responseRow] = await sql`SELECT * FROM responses WHERE id = ${responseId}`;
    if (!responseRow) return null;
    const response = mapResponse(responseRow);
    const [[projectRow], [linkRow], [itemRow], variableRows] = await Promise.all([
      sql`SELECT * FROM projects WHERE id = ${response.projectId}`,
      sql`SELECT * FROM coder_links WHERE id = ${response.coderLinkId}`,
      sql`SELECT * FROM project_items WHERE project_id = ${response.projectId} AND item_id = ${response.itemId}`,
      sql`SELECT * FROM project_variables WHERE project_id = ${response.projectId} ORDER BY output_order ASC`,
    ]);
    return {
      response,
      project: mapProject(projectRow),
      link: mapCoderLink(linkRow),
      item: mapItem(itemRow),
      variables: variableRows.map(mapVariable),
    };
  }

  const db = await readLocal();
  const response = db.responses.find((entry) => entry.id === responseId);
  if (!response) return null;
  return {
    response: clone(response),
    project: clone(db.projects.find((entry) => entry.id === response.projectId)),
    link: clone(db.coderLinks.find((entry) => entry.id === response.coderLinkId)),
    item: clone(db.items.find((entry) => entry.projectId === response.projectId && entry.itemId === response.itemId)),
    variables: db.variables.filter((entry) => entry.projectId === response.projectId).sort((a, b) => a.outputOrder - b.outputOrder),
  };
}
