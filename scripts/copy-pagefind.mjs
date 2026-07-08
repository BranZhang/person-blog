#!/usr/bin/env node

import { cp, mkdir } from "node:fs/promises";
import path from "node:path";

const source = path.resolve("dist/pagefind");
const target = path.resolve("public/pagefind");

await mkdir(path.dirname(target), { recursive: true });
await cp(source, target, { recursive: true, force: true });
