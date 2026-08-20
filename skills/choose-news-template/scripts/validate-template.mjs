#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
if (!input || process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: node validate-template.mjs <news-template.json>");
  process.exit(input ? 0 : 2);
}

const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const words = (value) => String(value ?? "").trim().split(/\s+/u).filter(Boolean).length;
const hex = (value) => /^#[0-9a-f]{6}$/iu.test(String(value ?? ""));
const placeholder = (value) => /\b(?:todo|tbd|replace this|example brand|example\.com|goes here)\b/iu.test(String(value ?? ""));

function luminance(value) {
  if (!hex(value)) return 0;
  const channels = value.slice(1).match(/.{2}/gu).map((channel) => Number.parseInt(channel, 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function isUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

let spec;
try {
  spec = JSON.parse(fs.readFileSync(path.resolve(input), "utf8"));
} catch (error) {
  console.error(`ERROR: Could not read valid JSON: ${error.message}`);
  process.exit(2);
}

for (const key of ["project", "theme", "brand", "content", "sources", "selection"]) {
  if (!(key in spec)) fail(`Missing top-level field: ${key}`);
}

const project = spec.project ?? {};
const allowedTemplates = new Set(["hero-card", "bulletin-card", "stat-card", "quote-card", "timeline-card", "unrot-app-card"]);
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(String(project.slug ?? ""))) fail("project.slug must use lowercase kebab-case");
if (!allowedTemplates.has(project.template)) fail("project.template is not supported");
if (!Number.isInteger(project.width) || project.width < 320) fail("project.width must be an integer of at least 320");
if (!Number.isInteger(project.height) || project.height < 320) fail("project.height must be an integer of at least 320");
if (!String(project.platform ?? "").trim()) fail("project.platform is required");

const theme = spec.theme ?? {};
if (theme.dark_mode !== false) fail("theme.dark_mode must be false; this skill does not create dark themes");
for (const key of ["background", "surface", "text", "muted", "accent", "border", "footer_text"]) {
  if (!hex(theme[key])) fail(`theme.${key} must be a six-digit hex color`);
}
if (luminance(theme.background) < 0.82) fail("theme.background is too dark; use white or a near-white color");
if (luminance(theme.surface) < 0.75) fail("theme.surface is too dark; use a light neutral or tint");

const brand = spec.brand ?? {};
for (const key of ["name", "handle", "tagline"]) {
  if (!String(brand[key] ?? "").trim()) fail(`brand.${key} is required`);
}

const content = spec.content ?? {};
if (!String(content.category ?? "").trim() || words(content.category) > 3) fail("content.category must contain 1-3 words");
if (!String(content.headline ?? "").trim() || words(content.headline) > 14 || String(content.headline ?? "").length > 90) {
  fail("content.headline is required and must stay within 14 words and 90 characters");
}
if (!String(content.summary ?? "").trim() || words(content.summary) > 50 || String(content.summary ?? "").length > 300) {
  fail("content.summary is required and must stay within 50 words and 300 characters");
}
if (words(content.cta) < 2 || words(content.cta) > 6) fail("content.cta must contain 2-6 words");
if (!content.image || typeof content.image !== "object") fail("content.image is required");
else {
  if ((project.template === "hero-card" || project.template === "unrot-app-card" || String(content.image.src ?? "").trim()) && !String(content.image.alt ?? "").trim()) fail("content.image.alt is required when an image is used");
  if ((project.template === "hero-card" || project.template === "unrot-app-card" || String(content.image.src ?? "").trim()) && !String(content.image.credit ?? "").trim()) fail("content.image.credit is required when an image is used");
}

if ((project.template === "hero-card" || project.template === "unrot-app-card") && !String(content.image?.src ?? "").trim()) warn(`${project.template} has no image source; the renderer will show a draft placeholder`);
if (project.template === "stat-card" && (!String(content.stat?.value ?? "").trim() || !String(content.stat?.label ?? "").trim())) fail("stat-card requires content.stat.value and content.stat.label");
if (project.template === "quote-card" && (!String(content.quote?.text ?? "").trim() || !String(content.quote?.attribution ?? "").trim())) fail("quote-card requires content.quote.text and content.quote.attribution");
if (project.template === "timeline-card" && (!Array.isArray(content.timeline) || content.timeline.length < 2 || content.timeline.length > 4)) fail("timeline-card requires 2-4 timeline items");
if (Array.isArray(content.timeline)) content.timeline.forEach((item, index) => {
  if (!String(item?.label ?? "").trim() || !String(item?.detail ?? "").trim()) fail(`content.timeline[${index}] requires label and detail`);
});
if (project.template === "unrot-app-card") {
  if (brand.name !== "Unrot") fail("unrot-app-card requires brand.name to be Unrot");
  if (!String(brand.logo ?? "").trim()) fail("unrot-app-card requires the official Unrot logo path");
  for (const key of ["app_store_badge", "google_play_badge"]) {
    if (!String(content.app_download?.[key] ?? "").trim()) fail(`unrot-app-card requires content.app_download.${key}`);
  }
  for (const key of ["app_store_url", "google_play_url"]) {
    if (!isUrl(content.app_download?.[key])) fail(`unrot-app-card requires a valid content.app_download.${key}`);
  }
}

if (!Array.isArray(spec.sources) || spec.sources.length === 0) fail("sources must contain at least one URL");
else spec.sources.forEach((url, index) => {
  if (!isUrl(url)) fail(`sources[${index}] must be an HTTP(S) URL`);
});
if (!String(spec.selection?.reason ?? "").trim()) fail("selection.reason is required");

function scan(value, trail = "") {
  if (typeof value === "string" && placeholder(value)) warn(`${trail || "spec"} appears to contain example or placeholder text`);
  else if (Array.isArray(value)) value.forEach((item, index) => scan(item, `${trail}[${index}]`));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => scan(item, trail ? `${trail}.${key}` : key));
}
scan(spec);

warnings.forEach((message) => console.warn(`WARNING: ${message}`));
errors.forEach((message) => console.error(`ERROR: ${message}`));
if (errors.length) {
  console.error(`Validation failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`Validation passed with ${warnings.length} warning(s).`);
