// O pdf.js precisa do worker como arquivo servido. Copiamos para public/ no
// build; a página aponta para basePath + /pdf.worker.mjs.
import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const pkg = path.dirname(require.resolve("pdfjs-dist/package.json"));
const src = path.join(pkg, "legacy", "build", "pdf.worker.min.mjs");
const dest = path.resolve("public", "pdf.worker.mjs");

await mkdir(path.dirname(dest), { recursive: true });
await copyFile(src, dest);
console.log(`worker do pdf.js -> ${path.relative(process.cwd(), dest)}`);
