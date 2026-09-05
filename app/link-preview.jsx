"use client";

import { useEffect, useState } from "react";
import { useT, fmt } from "@/lib/i18n";
import styles from "./coder.module.css";

// Site estático não tem /api/resolve. Sem a flag, links que precisariam de
// resolução (TikTok curto, Facebook) caem direto no cartão genérico.
const HAS_API = process.env.NEXT_PUBLIC_HAS_API === "1";

const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/gi;

// Prévia de rede social é iframe de terceiro: quem serve o post fica sabendo
// qual material está sendo analisado, e quando. Numa pesquisa de desinformação
// isso não é detalhe, então a prévia só carrega quando a pessoa pede. Quem
// prefere o comportamento antigo marca uma vez e vale para o navegador.
const PREVIEW_PREF = "codlab:previews";
const EMBEDS = new Set(["youtube", "instagram", "tweet", "tiktok", "facebook"]);

function lerPref() {
  try {
    return localStorage.getItem(PREVIEW_PREF) === "auto";
  } catch {
    return false;
  }
}

// Extrai URLs de dentro do texto, remove duplicatas e pontuação final.
export function extractLinks(text) {
  if (!text) return [];
  const found = text.match(URL_RE) || [];
  const cleaned = found.map((url) => url.replace(/[.,;!?)]+$/, ""));
  return [...new Set(cleaned)];
}

function classify(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { type: "generic", host: rawUrl, url: rawUrl };
  }
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
  const path = url.pathname;

  if (host === "youtu.be") {
    const id = path.slice(1);
    if (id) return { type: "youtube", id, url: rawUrl };
  }
  if (host === "youtube.com") {
    if (path.startsWith("/shorts/")) return { type: "youtube", id: path.split("/")[2], vertical: true, url: rawUrl };
    if (path.startsWith("/live/")) return { type: "youtube", id: path.split("/")[2], url: rawUrl };
    const v = url.searchParams.get("v");
    if (v) return { type: "youtube", id: v, url: rawUrl };
  }
  if (host === "instagram.com") {
    const m = path.match(/\/(p|reel|tv)\/([^/]+)/);
    if (m) return { type: "instagram", embed: `https://www.instagram.com/${m[1]}/${m[2]}/embed`, url: rawUrl };
  }
  if (host === "twitter.com" || host === "x.com") {
    const m = path.match(/\/status\/(\d+)/);
    if (m) return { type: "tweet", id: m[1], url: rawUrl };
  }
  if (host.endsWith("tiktok.com")) {
    const direct = path.match(/\/video\/(\d+)/);
    if (direct) return { type: "tiktok", id: direct[1], url: rawUrl };
    return { type: "tiktok", id: null, url: rawUrl }; // link curto (vt.tiktok.com) → resolver
  }
  if (host === "facebook.com" || host === "fb.watch") {
    return { type: "facebook", url: rawUrl };
  }
  return { type: "generic", host, url: rawUrl };
}

// Cache de resolução (evita refetch ao navegar entre registros).
const resolveCache = new Map();

function useResolved(rawUrl, enabled) {
  const [data, setData] = useState(() => resolveCache.get(rawUrl) || null);
  useEffect(() => {
    if (!enabled || data) return;
    if (!HAS_API) {
      const fallback = { url: rawUrl };
      resolveCache.set(rawUrl, fallback);
      setData(fallback);
      return;
    }
    let alive = true;
    fetch(`/api/resolve?url=${encodeURIComponent(rawUrl)}`)
      .then((r) => r.json())
      .then((d) => {
        resolveCache.set(rawUrl, d);
        if (alive) setData(d);
      })
      .catch(() => {
        const fallback = { url: rawUrl };
        resolveCache.set(rawUrl, fallback);
        if (alive) setData(fallback);
      });
    return () => {
      alive = false;
    };
  }, [rawUrl, enabled, data]);
  return data;
}

function Bar({ url, label }) {
  const t = useT();
  return (
    <div className={styles.previewBar}>
      <span className={styles.previewLabel}>{label}</span>
      <a href={url} target="_blank" rel="noopener noreferrer">
        {t.coder.open}
      </a>
    </div>
  );
}

function Reel({ src, title, vertical }) {
  return (
    <div className={vertical ? styles.videoWrap : styles.videoWrapWide}>
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function Loading({ label }) {
  const t = useT();
  return (
    <div className={styles.previewLoading}>
      {t.coder.loading} {label}
    </div>
  );
}

function GenericCard({ url, host }) {
  const t = useT();
  return (
    <div className={styles.genericCard}>
      <p>{fmt(t.coder.noPreview, { host: host || "" })}</p>
      <a className={styles.genericOpen} href={url} target="_blank" rel="noopener noreferrer">
        {t.coder.openTab}
      </a>
    </div>
  );
}

function TikTokPreview({ info }) {
  const needsResolve = !info.id;
  const resolved = useResolved(info.url, needsResolve);
  let id = info.id;
  if (needsResolve) {
    if (!resolved) {
      return (
        <div className={styles.preview}>
          <Bar url={info.url} label="TikTok" />
          <Loading label="TikTok" />
        </div>
      );
    }
    const m = (resolved.url || "").match(/\/video\/(\d+)/) || (resolved.url || "").match(/\/(\d{15,})/);
    id = m?.[1];
  }
  return (
    <div className={styles.preview}>
      <Bar url={info.url} label="TikTok" />
      {id ? <Reel src={`https://www.tiktok.com/embed/v2/${id}`} title="TikTok" vertical /> : <GenericCard url={info.url} host="tiktok.com" />}
    </div>
  );
}

function FacebookPreview({ info }) {
  const resolved = useResolved(info.url, true);
  if (!resolved) {
    return (
      <div className={styles.preview}>
        <Bar url={info.url} label="Facebook" />
        <Loading label="Facebook" />
      </div>
    );
  }
  const embed = resolved.fbVideo
    ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(resolved.fbVideo)}&show_text=false`
    : null;
  return (
    <div className={styles.preview}>
      <Bar url={info.url} label="Facebook" />
      {embed ? (
        <Reel src={embed} title="Facebook" vertical={resolved.fbVertical} />
      ) : (
        <GenericCard url={info.url} host="facebook.com" />
      )}
    </div>
  );
}

function PreviewGate({ info, label, onLoad, onAlways }) {
  const t = useT();
  return (
    <div className={styles.preview}>
      <Bar url={info.url} label={label} />
      <div className={styles.gate}>
        <p>{fmt(t.coder.previewNote, { host: label })}</p>
        <div className={styles.gateActions}>
          <button type="button" className={styles.gateLoad} onClick={onLoad}>
            {t.coder.loadPreview}
          </button>
          <button type="button" className={styles.gateAlways} onClick={onAlways}>
            {t.coder.alwaysLoad}
          </button>
        </div>
      </div>
    </div>
  );
}

const EMBED_LABEL = {
  youtube: "YouTube",
  instagram: "Instagram",
  tweet: "X / Twitter",
  tiktok: "TikTok",
  facebook: "Facebook",
};

function OnePreview({ link, auto, onAlways }) {
  const info = classify(link);
  const [pedido, setPedido] = useState(false);

  if (EMBEDS.has(info.type) && !auto && !pedido) {
    return (
      <PreviewGate
        info={info}
        label={EMBED_LABEL[info.type] || info.host}
        onLoad={() => setPedido(true)}
        onAlways={onAlways}
      />
    );
  }

  if (info.type === "youtube") {
    return (
      <div className={styles.preview}>
        <Bar url={info.url} label="YouTube" />
        <Reel src={`https://www.youtube-nocookie.com/embed/${info.id}`} title="YouTube" vertical={info.vertical} />
      </div>
    );
  }
  if (info.type === "instagram") {
    return (
      <div className={styles.preview}>
        <Bar url={info.url} label="Instagram" />
        <iframe className={styles.socialFrame} src={info.embed} title="Instagram" scrolling="no" />
      </div>
    );
  }
  if (info.type === "tweet") {
    return (
      <div className={styles.preview}>
        <Bar url={info.url} label="X / Twitter" />
        <iframe
          className={styles.socialFrame}
          src={`https://platform.twitter.com/embed/Tweet.html?id=${info.id}&theme=light&dnt=true`}
          title="Post no X"
          scrolling="no"
        />
      </div>
    );
  }
  if (info.type === "tiktok") return <TikTokPreview info={info} />;
  if (info.type === "facebook") return <FacebookPreview info={info} />;

  return (
    <div className={styles.preview}>
      <Bar url={info.url} label={info.host} />
      <GenericCard url={info.url} host={info.host} />
    </div>
  );
}

export function LinkPreviews({ links }) {
  const [auto, setAuto] = useState(false);
  useEffect(() => setAuto(lerPref()), []);

  function sempre() {
    try {
      localStorage.setItem(PREVIEW_PREF, "auto");
    } catch {
      // Sem storage a escolha vale só para esta sessão, o que já basta.
    }
    setAuto(true);
  }

  if (!links.length) return null;
  return (
    <div className={styles.previews}>
      {links.map((link) => (
        <OnePreview key={link} link={link} auto={auto} onAlways={sempre} />
      ))}
    </div>
  );
}
