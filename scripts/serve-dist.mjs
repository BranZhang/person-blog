#!/usr/bin/env node
/* eslint-disable no-console */

import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const root = path.resolve("dist");
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? "4321");
const base = (process.env.SITE_BASE ?? "/").replace(/\/$/, "");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".xml": "application/xml; charset=utf-8",
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${host}:${port}`);
    let pathname = decodeURIComponent(url.pathname);

    if (base && base !== "/" && pathname.startsWith(base)) {
      pathname = pathname.slice(base.length) || "/";
    }

    const file = await resolveFile(pathname);
    response.writeHead(200, {
      "Content-Type":
        contentTypes[path.extname(file).toLowerCase()] ??
        "application/octet-stream",
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}${base || "/"}`);
});

async function resolveFile(pathname) {
  const safePath = path
    .normalize(pathname)
    .replace(/^(\.\.[/\\])+/, "")
    .replace(/^[/\\]/, "");
  let file = path.resolve(root, safePath);
  if (!file.startsWith(root)) throw new Error("Unsafe path");

  if (existsSync(file) && (await stat(file)).isDirectory()) {
    file = path.join(file, "index.html");
  }

  if (!existsSync(file) && !path.extname(file)) {
    file = path.join(file, "index.html");
  }

  if (!existsSync(file)) throw new Error("Missing file");
  return file;
}
