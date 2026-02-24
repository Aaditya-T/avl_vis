import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexPath)) {
  throw new Error("dist/index.html not found. Run vite build first.");
}

let html = fs.readFileSync(indexPath, "utf8");

const scriptMatch = html.match(/<script[^>]*src="(.+?)"[^>]*><\/script>/i);
if (scriptMatch) {
  const scriptRelPath = scriptMatch[1];
  const scriptPath = path.join(distDir, scriptRelPath.replace(/^\.\//, "").replace(/^\//, ""));
  const js = fs.readFileSync(scriptPath, "utf8").replace(/<\/script>/gi, "<\\/script>");
  html = html.replace(scriptMatch[0], () => `<script type="module">${js}</script>`);
}

const linkMatch = html.match(/<link[^>]*rel="stylesheet"[^>]*href="(.+?)"[^>]*>/i);
if (linkMatch) {
  const cssRelPath = linkMatch[1];
  const cssPath = path.join(distDir, cssRelPath.replace(/^\.\//, "").replace(/^\//, ""));
  const css = fs.readFileSync(cssPath, "utf8");
  html = html.replace(linkMatch[0], () => `<style>${css}</style>`);
}

fs.writeFileSync(indexPath, html, "utf8");
