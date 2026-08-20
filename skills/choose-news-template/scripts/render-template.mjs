#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const input = args[0];
const outputIndex = args.indexOf("--output");
const output = outputIndex >= 0 ? args[outputIndex + 1] : "news-template.svg";
const templateIndex = args.indexOf("--template");
const requestedTemplate = templateIndex >= 0 ? args[templateIndex + 1] : undefined;

if (!input || args.includes("--help") || args.includes("-h")) {
  console.log("Usage: node render-template.mjs <news-template.json> [--template <name>] [--output <file.svg>]");
  process.exit(input ? 0 : 2);
}

let spec;
try {
  spec = JSON.parse(fs.readFileSync(path.resolve(input), "utf8"));
} catch (error) {
  console.error(`Could not read valid JSON: ${error.message}`);
  process.exit(2);
}

const xml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

function wrap(value, maxChars, maxLines) {
  const tokens = String(value ?? "").trim().split(/\s+/u).filter(Boolean);
  const lines = [];
  let line = "";
  for (const token of tokens) {
    const candidate = line ? `${line} ${token}` : token;
    if (!line || candidate.length <= maxChars) line = candidate;
    else {
      lines.push(line);
      line = token;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const result = lines.slice(0, maxLines);
  result[maxLines - 1] = `${result[maxLines - 1].replace(/[.,;:!?]?$/u, "")}…`;
  return result;
}

const tspans = (lines, x, y, step) => lines.map((line, index) => `<tspan x="${x}" y="${y + index * step}">${xml(line)}</tspan>`).join("");
const localHref = (value) => {
  if (!value || /^(?:https?:|data:|file:)/iu.test(value)) return value ?? "";
  const resolved = path.resolve(path.dirname(path.resolve(input)), value);
  if (!fs.existsSync(resolved)) throw new Error(`Asset not found: ${resolved}`);
  const mime = new Map([
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".webp", "image/webp"],
    [".svg", "image/svg+xml"]
  ]).get(path.extname(resolved).toLowerCase());
  if (!mime) throw new Error(`Unsupported image format: ${resolved}`);
  return `data:${mime};base64,${fs.readFileSync(resolved).toString("base64")}`;
};

const project = spec.project ?? {};
const theme = spec.theme ?? {};
const brand = spec.brand ?? {};
const content = spec.content ?? {};
const width = Number(project.width ?? 1080);
const height = Number(project.height ?? 1350);
const selectedTemplate = requestedTemplate ?? project.template;
const headline = wrap(content.headline, 33, 3);
const summary = wrap(content.summary, 58, 5);
const logoHref = localHref(brand.logo);
const imageHref = localHref(content.image?.src);
const initial = String(brand.name ?? "N").trim().slice(0, 1).toUpperCase();

const logo = logoHref
  ? `<image href="${xml(logoHref)}" x="64" y="52" width="72" height="72" preserveAspectRatio="xMidYMid meet"/>`
  : `<circle cx="100" cy="88" r="36" fill="${xml(theme.accent)}"/><text x="100" y="102" text-anchor="middle" font-size="38" font-weight="800" fill="${xml(theme.footer_text)}">${xml(initial)}</text>`;

const header = `${logo}
  <text x="156" y="82" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800" fill="${xml(theme.text)}">${xml(brand.name)}</text>
  <text x="156" y="112" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="650" fill="${xml(theme.accent)}">${xml(brand.tagline)}</text>
  <rect x="842" y="60" width="174" height="48" rx="24" fill="${xml(theme.surface)}" stroke="${xml(theme.border)}"/>
  <text x="929" y="91" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" fill="${xml(theme.accent)}">${xml(content.category)}</text>`;

const creditLine = selectedTemplate === "hero-card" && String(content.image?.credit ?? "").trim()
  ? `<text x="64" y="1178" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="${xml(theme.muted)}">${xml(content.image.credit)}</text>`
  : "";
const standardFooter = `${creditLine}
  <rect x="64" y="1204" width="952" height="104" rx="28" fill="${xml(theme.accent)}"/>
  <text x="96" y="1269" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800" fill="${xml(theme.footer_text)}">${xml(brand.name)}</text>
  <text x="984" y="1269" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="750" fill="${xml(theme.footer_text)}">${xml(content.cta)} →</text>`;

function downloadFooter() {
  const appStoreBadge = localHref(content.app_download?.app_store_badge);
  const googlePlayBadge = localHref(content.app_download?.google_play_badge);
  return `<text x="64" y="1178" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="${xml(theme.muted)}">${xml(content.image?.credit)}</text>
  <rect x="64" y="1204" width="952" height="104" rx="28" fill="${xml(theme.accent)}"/>
  <text x="96" y="1252" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800" fill="${xml(theme.footer_text)}">Unrot</text>
  <text x="96" y="1280" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="650" fill="${xml(theme.footer_text)}">Learn AI in 5 minutes</text>
  <a href="${xml(content.app_download?.app_store_url)}"><image href="${xml(appStoreBadge)}" x="548" y="1225" width="205" height="62" preserveAspectRatio="xMidYMid meet"/></a>
  <a href="${xml(content.app_download?.google_play_url)}"><image href="${xml(googlePlayBadge)}" x="779" y="1225" width="205" height="62" preserveAspectRatio="xMidYMid meet"/></a>`;
}

const footer = selectedTemplate === "unrot-app-card" ? downloadFooter() : standardFooter;

function heroCard() {
  const hero = imageHref
    ? `<image href="${xml(imageHref)}" x="64" y="160" width="952" height="500" preserveAspectRatio="xMidYMid slice" clip-path="url(#heroClip)"/>`
    : `<rect x="64" y="160" width="952" height="500" rx="32" fill="${xml(theme.surface)}" stroke="${xml(theme.border)}"/><text x="540" y="421" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="750" fill="${xml(theme.muted)}">ADD LICENSED HERO IMAGE</text>`;
  const bodyY = 744 + headline.length * 62 + 30;
  return `${hero}
  <text font-family="Inter, Arial, sans-serif" font-size="52" font-weight="800" fill="${xml(theme.text)}">${tspans(headline, 64, 744, 62)}</text>
  <text font-family="Inter, Arial, sans-serif" font-size="30" font-weight="450" fill="${xml(theme.muted)}">${tspans(summary, 64, bodyY, 42)}</text>`;
}

function bulletinCard() {
  const bodyY = 330 + headline.length * 82 + 52;
  return `<text x="64" y="232" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="800" fill="${xml(theme.accent)}">BREAKING / UPDATE</text>
  <text font-family="Inter, Arial, sans-serif" font-size="68" font-weight="820" fill="${xml(theme.text)}">${tspans(wrap(content.headline, 25, 4), 64, 330, 82)}</text>
  <line x1="64" y1="${bodyY - 34}" x2="1016" y2="${bodyY - 34}" stroke="${xml(theme.border)}" stroke-width="2"/>
  <text font-family="Inter, Arial, sans-serif" font-size="32" font-weight="450" fill="${xml(theme.muted)}">${tspans(summary, 64, bodyY, 46)}</text>`;
}

function statCard() {
  return `<rect x="64" y="180" width="952" height="420" rx="32" fill="${xml(theme.surface)}" stroke="${xml(theme.border)}"/>
  <text x="96" y="430" font-family="Inter, Arial, sans-serif" font-size="150" font-weight="850" fill="${xml(theme.accent)}">${xml(content.stat?.value)}</text>
  <text x="100" y="518" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="${xml(theme.text)}">${xml(content.stat?.label)}</text>
  <text font-family="Inter, Arial, sans-serif" font-size="50" font-weight="800" fill="${xml(theme.text)}">${tspans(headline, 64, 700, 60)}</text>
  <text font-family="Inter, Arial, sans-serif" font-size="29" font-weight="450" fill="${xml(theme.muted)}">${tspans(summary, 64, 700 + headline.length * 60 + 34, 41)}</text>`;
}

function quoteCard() {
  const quoteLines = wrap(content.quote?.text, 38, 6);
  return `<text x="64" y="300" font-family="Georgia, serif" font-size="180" fill="${xml(theme.accent)}">“</text>
  <text font-family="Inter, Arial, sans-serif" font-size="49" font-weight="750" fill="${xml(theme.text)}">${tspans(quoteLines, 120, 370, 62)}</text>
  <text x="120" y="${405 + quoteLines.length * 62}" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="${xml(theme.accent)}">— ${xml(content.quote?.attribution)}</text>
  <line x1="64" y1="880" x2="1016" y2="880" stroke="${xml(theme.border)}" stroke-width="2"/>
  <text font-family="Inter, Arial, sans-serif" font-size="28" font-weight="450" fill="${xml(theme.muted)}">${tspans(wrap(content.summary, 62, 4), 64, 940, 40)}</text>`;
}

function timelineCard() {
  const items = Array.isArray(content.timeline) ? content.timeline.slice(0, 4) : [];
  const startY = 500;
  const step = items.length > 3 ? 150 : 178;
  const timeline = items.map((item, index) => {
    const y = startY + index * step;
    return `<circle cx="96" cy="${y}" r="18" fill="${xml(theme.accent)}"/>
    ${index < items.length - 1 ? `<line x1="96" y1="${y + 20}" x2="96" y2="${y + step - 20}" stroke="${xml(theme.border)}" stroke-width="6"/>` : ""}
    <text x="144" y="${y - 4}" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800" fill="${xml(theme.text)}">${xml(item.label)}</text>
    <text x="144" y="${y + 35}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="450" fill="${xml(theme.muted)}">${xml(item.detail)}</text>`;
  }).join("");
  return `<text font-family="Inter, Arial, sans-serif" font-size="52" font-weight="800" fill="${xml(theme.text)}">${tspans(headline, 64, 220, 62)}</text>
  <text font-family="Inter, Arial, sans-serif" font-size="29" font-weight="450" fill="${xml(theme.muted)}">${tspans(wrap(content.summary, 60, 3), 64, 220 + headline.length * 62 + 30, 41)}</text>
  ${timeline}`;
}

const renderers = {
  "hero-card": heroCard,
  "bulletin-card": bulletinCard,
  "stat-card": statCard,
  "quote-card": quoteCard,
  "timeline-card": timelineCard,
  "unrot-app-card": heroCard
};

if (!renderers[selectedTemplate]) {
  console.error(`Unsupported template: ${selectedTemplate}`);
  process.exit(1);
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1080 1350" role="img" aria-labelledby="title desc">
  <title id="title">${xml(content.headline)}</title>
  <desc id="desc">${xml(content.image?.alt)}</desc>
  <defs><clipPath id="heroClip"><rect x="64" y="160" width="952" height="500" rx="32"/></clipPath></defs>
  <rect width="1080" height="1350" fill="${xml(theme.background)}"/>
  ${header}
  ${renderers[selectedTemplate]()}
  ${footer}
</svg>`;

const outputPath = path.resolve(output);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, svg, "utf8");
console.log(`Wrote ${outputPath}`);
