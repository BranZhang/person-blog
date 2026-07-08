#!/usr/bin/env node
/* eslint-disable no-console */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const wpBaseUrl = process.env.WP_BASE_URL;
const status = process.env.WP_STATUS ?? "publish";
const importPages = process.env.WP_IMPORT_PAGES === "true";
const downloadMedia = process.env.WP_DOWNLOAD_MEDIA !== "false";
const postsDir = path.resolve(rootDir, process.env.WP_POSTS_DIR ?? "src/content/posts");
const pagesDir = path.resolve(rootDir, process.env.WP_PAGES_DIR ?? "src/content/pages/imported");
const mediaDir = path.resolve(rootDir, process.env.WP_MEDIA_DIR ?? "public/wp-content/uploads");
const mediaPublicBase = process.env.WP_MEDIA_PUBLIC_BASE ?? "/wp-content/uploads";

if (!wpBaseUrl) {
  console.error("Missing WP_BASE_URL. Copy .env.example or pass WP_BASE_URL=https://your-site/.");
  process.exit(1);
}

const apiBase = new URL("wp-json/wp/v2/", ensureTrailingSlash(wpBaseUrl));
const authHeaders = getAuthHeaders();

await mkdir(postsDir, { recursive: true });
if (importPages) await mkdir(pagesDir, { recursive: true });
if (downloadMedia) await mkdir(mediaDir, { recursive: true });

const posts = await fetchAll("posts", { status, _embed: "1", context: "view" });
await writeEntries(posts, "post", postsDir);

if (importPages) {
  const pages = await fetchAll("pages", { status, _embed: "1", context: "view" });
  await writeEntries(pages, "page", pagesDir);
}

console.log(`Imported ${posts.length} posts${importPages ? " and pages" : ""}.`);

async function writeEntries(entries, kind, targetDir) {
  const termIds = collectTermIds(entries);
  const [tagsById, categoriesById] = await Promise.all([
    fetchTerms("tags", termIds.tags),
    fetchTerms("categories", termIds.categories),
  ]);

  for (const entry of entries) {
    const slug = sanitizeFileName(entry.slug || String(entry.id));
    const filePath = path.join(targetDir, `${slug}.md`);
    const title = decodeEntities(stripTags(entry.title?.rendered ?? slug)).trim() || slug;
    const rawContent = entry.content?.rendered ?? "";
    const content = downloadMedia ? await localizeMedia(rawContent) : rawContent;
    const description = buildDescription(entry.excerpt?.rendered || rawContent);
    const tags = buildTags(entry, tagsById, categoriesById);
    const frontmatter = [
      "---",
      `title: ${yamlString(title)}`,
      `description: ${yamlString(description)}`,
      `pubDatetime: ${toIso(entry.date_gmt || entry.date)}`,
      entry.modified_gmt || entry.modified
        ? `modDatetime: ${toIso(entry.modified_gmt || entry.modified)}`
        : "",
      `author: ${yamlString(entry._embedded?.author?.[0]?.name ?? "Bran Zhang")}`,
      "tags:",
      ...tags.map(tag => `  - ${yamlString(tag)}`),
      entry.link ? `canonicalURL: ${yamlString(entry.link)}` : "",
      "---",
      "",
    ].filter(Boolean).join("\n");

    await writeFile(filePath, `${frontmatter}${content.trim()}\n`, "utf8");
    console.log(`Imported ${kind}: ${slug}`);
  }
}

async function fetchAll(resource, params) {
  const results = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = buildApiUrl(resource, { ...params, per_page: "100", page: String(page) });
    const response = await fetch(url, { headers: authHeaders });
    if (!response.ok) {
      throw new Error(`${resource} page ${page} failed: ${response.status} ${response.statusText}`);
    }

    const body = await response.json();
    if (!Array.isArray(body)) {
      throw new Error(`${resource} returned a non-array response.`);
    }

    results.push(...body);
    totalPages = Number(response.headers.get("x-wp-totalpages") ?? "1");
    page += 1;
  } while (page <= totalPages);

  return results;
}

async function fetchTerms(resource, ids) {
  const map = new Map();
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  for (let index = 0; index < uniqueIds.length; index += 100) {
    const include = uniqueIds.slice(index, index + 100).join(",");
    if (!include) continue;
    const terms = await fetchAll(resource, { include, hide_empty: "false" });
    for (const term of terms) map.set(term.id, term.name);
  }
  return map;
}

function collectTermIds(entries) {
  return entries.reduce(
    (ids, entry) => {
      ids.tags.push(...(entry.tags ?? []));
      ids.categories.push(...(entry.categories ?? []));
      return ids;
    },
    { tags: [], categories: [] }
  );
}

function buildTags(entry, tagsById, categoriesById) {
  const names = [
    ...(entry.tags ?? []).map(id => tagsById.get(id)).filter(Boolean),
    ...(entry.categories ?? []).map(id => categoriesById.get(id)).filter(Boolean),
  ];
  return [...new Set(names.length > 0 ? names : ["imported"])];
}

async function localizeMedia(html) {
  const urls = findUploadUrls(html);
  let output = html;

  for (const originalUrl of urls) {
    try {
      const normalizedUrl = normalizeRemoteUrl(originalUrl);
      const remote = new URL(normalizedUrl);
      const marker = "/wp-content/uploads/";
      const markerIndex = remote.pathname.indexOf(marker);
      if (markerIndex < 0) continue;

      const uploadPath = remote.pathname.slice(markerIndex + marker.length);
      const safeSegments = uploadPath
        .split("/")
        .filter(Boolean)
        .map(segment => sanitizePathSegment(decodeURIComponent(segment)));
      if (safeSegments.length === 0) continue;

      const target = path.resolve(mediaDir, ...safeSegments);
      if (!target.startsWith(mediaDir)) {
        console.warn(`Skipped unsafe media path: ${originalUrl}`);
        continue;
      }

      const response = await fetch(normalizedUrl, { headers: authHeaders });
      if (!response.ok) {
        console.warn(`Skipped media ${originalUrl}: ${response.status}`);
        continue;
      }

      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, Buffer.from(await response.arrayBuffer()));

      const publicUrl = `${mediaPublicBase.replace(/\/$/, "")}/${safeSegments
        .map(encodeURIComponent)
        .join("/")}`;
      output = output.split(originalUrl).join(publicUrl);
    } catch (error) {
      console.warn(`Skipped media ${originalUrl}: ${error.message}`);
    }
  }

  return output;
}

function findUploadUrls(html) {
  const pattern = /(?:https?:)?\/\/[^"'\s<>)]*\/wp-content\/uploads\/[^"'\s<>)]*/g;
  return [...new Set(html.match(pattern) ?? [])];
}

function normalizeRemoteUrl(url) {
  if (url.startsWith("//")) {
    return `${new URL(wpBaseUrl).protocol}${url}`;
  }
  return url;
}

function buildApiUrl(resource, params) {
  const url = new URL(resource, apiBase);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

function getAuthHeaders() {
  if (process.env.WP_AUTH_HEADER) {
    return { Authorization: process.env.WP_AUTH_HEADER };
  }

  if (process.env.WP_USERNAME && process.env.WP_APP_PASSWORD) {
    const token = Buffer.from(`${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString("base64");
    return { Authorization: `Basic ${token}` };
  }

  return {};
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ");
}

function buildDescription(value) {
  const text = decodeEntities(stripTags(value)).replace(/\s+/g, " ").trim();
  return text.length > 180 ? `${text.slice(0, 177).trim()}...` : text || "Imported WordPress post.";
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function sanitizeFileName(value) {
  return sanitizePathSegment(value)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "post";
}

function sanitizePathSegment(value) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").replace(/^\.+$/, "-");
}

function yamlString(value) {
  return JSON.stringify(value ?? "");
}

function toIso(value) {
  const date = value ? new Date(value.endsWith("Z") ? value : `${value}Z`) : new Date();
  return date.toISOString();
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
