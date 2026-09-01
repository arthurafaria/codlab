// Resolve links encurtados de redes sociais no servidor (segue redirects com
// user-agent de navegador). Devolve dados para o preview embutir o vídeo.
//
// - TikTok (vt.tiktok.com): segue redirect → id do vídeo (via `url` final).
// - Facebook (facebook.com/share/*): usa mbasic (resolve sem JS) e extrai o id
//   do reel/vídeo do redirect → `fbVideo` canônico para o plugin oficial.
//
// Cookies: NÃO são necessários (a resolução é anônima). Mas se existir
// data/social-cookies.json (gitignored) o cookie do domínio é enviado junto.

import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function loadCookies() {
  try {
    const p = path.join(process.cwd(), "data", "social-cookies.json");
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {}
  return {};
}

function cookieFor(host) {
  const cookies = loadCookies();
  const key = Object.keys(cookies).find((k) => host.includes(k));
  return key ? cookies[key] : null;
}

function safeDecode(value) {
  let out = value;
  for (let i = 0; i < 2; i += 1) {
    try {
      out = decodeURIComponent(out);
    } catch {
      break;
    }
  }
  return out;
}

async function resolveFacebook(target) {
  const mb = target.replace(/:\/\/(www\.|m\.|web\.|mbasic\.)?facebook\.com/, "://mbasic.facebook.com");
  const headers = { "user-agent": MOBILE_UA, "accept-language": "pt-BR,pt;q=0.9,en;q=0.8" };
  const cookie = cookieFor("facebook.com");
  if (cookie) headers.cookie = cookie;

  const res = await fetch(mb, { redirect: "follow", headers });
  let hay = safeDecode(res.url);
  if (!/reel\/\d+|videos\/\d+|[?&]v=\d+/.test(hay)) {
    try {
      hay += " " + (await res.text());
    } catch {}
  }
  const reel = hay.match(/reel\/(\d+)/);
  if (reel) return { fbVideo: `https://www.facebook.com/reel/${reel[1]}`, fbVertical: true };
  const vid = hay.match(/videos\/(\d+)/) || hay.match(/[?&]v=(\d+)/);
  if (vid) return { fbVideo: `https://www.facebook.com/watch/?v=${vid[1]}`, fbVertical: false };
  return { url: res.url };
}

export async function GET(request) {
  const target = new URL(request.url).searchParams.get("url");
  if (!target) return Response.json({ error: "missing url" }, { status: 400 });

  let host = "";
  try {
    host = new URL(target).hostname.replace(/^www\.|^m\.|^vt\./, "");
  } catch {
    return Response.json({ url: target });
  }

  try {
    if (host.includes("facebook.com") || host === "fb.watch") {
      return Response.json(await resolveFacebook(target));
    }
    const headers = { "user-agent": DESKTOP_UA, "accept-language": "pt-BR,pt;q=0.9,en;q=0.8" };
    const cookie = cookieFor(host);
    if (cookie) headers.cookie = cookie;
    const res = await fetch(target, { redirect: "follow", headers });
    return Response.json({ url: res.url });
  } catch (error) {
    return Response.json({ url: target, error: String(error) });
  }
}
