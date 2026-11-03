// Tiny local server for testing: serves the site and runs api/quote.js. Usage: npm run dev
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import handler from "./api/quote.js";

const types = { ".html": "text/html", ".css": "text/css", ".png": "image/png", ".js": "text/javascript", ".svg": "image/svg+xml" };
const port = process.env.PORT || 3000;

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/quote") {
    let raw = "";
    for await (const c of req) raw += c;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (o) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(o)); };
    return handler(req, res);
  }
  const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  if (file.includes("..") || file.startsWith("api") || file.startsWith("node_modules") || file.startsWith(".env") || file === "package.json" || file.endsWith(".mjs")) {
    res.statusCode = 404; return res.end("Not found");
  }
  try {
    const data = await readFile(join(process.cwd(), file));
    res.setHeader("content-type", types[extname(file)] || "application/octet-stream");
    res.end(data);
  } catch { res.statusCode = 404; res.end("Not found"); }
}).listen(port, () => console.log(`Site running at http://localhost:${port}`));
