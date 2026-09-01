import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import mammoth from "mammoth";
import { list, put } from "@vercel/blob";

const IMAGE_RE = /\.(png|jpe?g|webp)$/i;
const localRoot = path.join(process.cwd(), ".local-data", "uploads");

function safeName(name) {
  return path.basename(name).replace(/[^\w.-]+/g, "_");
}

export async function readCodebook(file) {
  if (!file || file.size === 0) return "";
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }
  return buffer.toString("utf8");
}

export async function extractImages({ zipFile, imageFiles }) {
  const images = [];

  if (zipFile && zipFile.size > 0) {
    const zip = await JSZip.loadAsync(Buffer.from(await zipFile.arrayBuffer()));
    for (const [name, entry] of Object.entries(zip.files)) {
      if (entry.dir || !IMAGE_RE.test(name)) continue;
      images.push({
        filename: safeName(name),
        buffer: Buffer.from(await entry.async("nodebuffer")),
        contentType: contentTypeFor(name),
      });
    }
  }

  for (const file of imageFiles || []) {
    if (!file || file.size === 0 || !IMAGE_RE.test(file.name)) continue;
    images.push({
      filename: safeName(file.name),
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || contentTypeFor(file.name),
    });
  }

  const unique = new Map();
  images.forEach((image) => unique.set(image.filename.toLowerCase(), image));
  return [...unique.values()].sort((a, b) => a.filename.localeCompare(b.filename));
}

export async function storeImages(projectId, images) {
  const stored = [];
  for (const image of images) {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`projects/${projectId}/${image.filename}`, image.buffer, {
        access: "public",
        contentType: image.contentType,
      });
      stored.push({ ...image, url: blob.url });
    } else {
      const directory = path.join(localRoot, projectId);
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(path.join(directory, image.filename), image.buffer);
      stored.push({ ...image, url: `/api/files/${projectId}/${encodeURIComponent(image.filename)}` });
    }
  }
  return stored;
}

export async function readLocalUpload(projectId, filename) {
  const filePath = path.join(localRoot, projectId, safeName(filename));
  return {
    buffer: await fs.readFile(filePath),
    contentType: contentTypeFor(filename),
  };
}

export async function listStoredImages(projectId) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const result = await list({ prefix: `projects/${projectId}/` });
    return result.blobs
      .filter((blob) => IMAGE_RE.test(blob.pathname))
      .map((blob, index) => ({
        itemId: String(index + 1).padStart(3, "0"),
        imageFilename: path.basename(blob.pathname),
        imageUrl: blob.url,
        metadata: { image_filename: path.basename(blob.pathname) },
        sortOrder: index + 1,
      }));
  }

  const directory = path.join(localRoot, projectId);
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && IMAGE_RE.test(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((entry, index) => ({
        itemId: String(index + 1).padStart(3, "0"),
        imageFilename: entry.name,
        imageUrl: `/api/files/${projectId}/${encodeURIComponent(entry.name)}`,
        metadata: { image_filename: entry.name },
        sortOrder: index + 1,
      }));
  } catch {
    return [];
  }
}

function contentTypeFor(filename) {
  const name = filename.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
