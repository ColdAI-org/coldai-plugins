// Checks each plugin's listing for Anthropic's and OpenAI's plugin directories: plugin.json against the portable Agent
// Plugins schema's keys and OpenAI's interface limits, and the same as .claude-plugin/plugin.json where they overlap;
// the brand colour's contrast with white; the SVG icons, README.md and LICENSE; no stray, linked or oversized files
// under plugins/; and one exact version in every package launcher. Node alone, no packages:
// node scripts/check-listing.mjs
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PLUGINS = join(ROOT, "plugins");
const SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
// The portable manifest's root keys, every one of them required here, and its author's keys.
const KEYS = [
  "$schema", "name", "version", "description", "author", "homepage", "repository", "license", "keywords", "extensions",
];
const AUTHOR_KEYS = ["name", "email", "url"];
// What both of a plugin's manifests hold, which must be the same in both.
const SHARED = ["version", "description", "author", "homepage", "repository", "license", "keywords"];
// OpenAI's interface: its text limits in characters, its links, its prompts, its brand colour's least contrast with
// white, and its icons' least size in px.
const TEXT_LIMITS = { displayName: 30, shortDescription: 30, longDescription: 4000 };
const LINKS = ["websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"];
const PROMPTS = 3;
const PROMPT_LIMIT = 128;
const MIN_CONTRAST = 2;
const MIN_ICON = 48;
// Anthropic's directory: a README of at least 40 words outside code, images only as SVG or PNG, every other file under
// 256 KiB, and no system files.
const MIN_WORDS = 40;
const MAX_BYTES = 256 * 1024;
const IMAGES = [".svg", ".png"];
const OTHER_IMAGES = [".jpg", ".jpeg", ".gif", ".webp", ".avif", ".bmp", ".ico", ".tif", ".tiff", ".heic"];
const STRAY = [".DS_Store", "Thumbs.db"];
// A package launcher and what it launches, after any flags; a package with one exact version; a Markdown image.
const LAUNCHER = /(?<![\w./-])(?:npx|bunx|pnpm\s+dlx|yarn\s+dlx)(?:\s+-\S*)*\s+([^\s`'"()<>]+)/g;
const PINNED = /^((?:@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*)@(\d+\.\d+\.\d+(?:-[\w.]+)?)$/;
const IMAGE = /!\[[^\]]*\]\(\s*<?([^\s)>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const ROOT_LICENSE = readFileSync(join(ROOT, "LICENSE"));

const problems = [];
const colours = [];
const problem = (file, text) => problems.push(`${file}: ${text}`);
const rel = (path) => relative(ROOT, path).split(sep).join("/");
const chars = (text) => [...text].length;
const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (value, limit = Infinity) => typeof value === "string" && value.trim() !== "" && chars(value) <= limit;
const isTextList = (value) => Array.isArray(value) && value.every((item) => isText(item));
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function isHttps(value) {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

// A file's contents, or undefined, with a problem, if it can't be read.
function read(path, encoding) {
  try {
    return readFileSync(path, encoding);
  } catch {
    problem(rel(path), "is missing");
    return undefined;
  }
}

function readJson(path) {
  const text = read(path, "utf8");
  if (text === undefined) return undefined;
  try {
    const value = JSON.parse(text);
    if (isObject(value)) return value;
    problem(rel(path), "must be a JSON object");
  } catch (error) {
    problem(rel(path), `isn't valid JSON: ${error.message}`);
  }
  return undefined;
}

// WCAG 2's relative luminance of a #RRGGBB colour, and its contrast ratio with white.
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrastWithWhite = (hex) => 1.05 / (luminance(hex) + 0.05);

// An SVG's size, from its root tag: its width and height in px, or else its viewBox.
function svgSize(svg) {
  const tag = svg.match(/<svg\b[^>]*>/)?.[0];
  if (tag === undefined) return undefined;
  const attribute = (name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`))?.[1];
  const length = (value) => (/^\s*\d+(\.\d+)?(px)?\s*$/.test(value ?? "") ? parseFloat(value) : undefined);
  const width = length(attribute("width"));
  const height = length(attribute("height"));
  if (width !== undefined && height !== undefined) return { width, height };
  const box = (attribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
  return box.length === 4 && box.every(Number.isFinite) ? { width: box[2], height: box[3] } : undefined;
}

// An icon that OpenAI's listing names: an SVG inside the plugin's folder, square, and at least 48 px.
function checkIcon(dir, file, key, value) {
  const path = typeof value === "string" && value.startsWith("./") ? resolve(dir, value) : undefined;
  if (path === undefined || !path.startsWith(dir + sep)) {
    problem(file, `interface.${key} must be a path inside the plugin's folder that starts with ./`);
    return;
  }
  if (extname(path).toLowerCase() !== ".svg") {
    problem(file, `interface.${key} must be an SVG`);
    return;
  }
  const svg = read(path, "utf8");
  if (svg === undefined) return;
  const size = svgSize(svg);
  if (size === undefined) problem(rel(path), "needs a width and height, or a viewBox");
  else if (size.width !== size.height) problem(rel(path), `must be square, not ${size.width}×${size.height}`);
  else if (size.width < MIN_ICON) problem(rel(path), `must be at least ${MIN_ICON} px, not ${size.width}`);
}

// Each line of a Markdown file, with whether it's in a fenced code block, the fences included.
function* markdownLines(markdown) {
  let fence;
  for (const line of markdown.split(/\r?\n/)) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/)?.[1];
    if (fence === undefined) {
      if (marker !== undefined) fence = marker;
      yield { line, code: fence !== undefined };
    } else {
      if (marker !== undefined && marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker) {
        fence = undefined;
      }
      yield { line, code: true };
    }
  }
}

const proseWords = (markdown) =>
  [...markdownLines(markdown)]
    .filter(({ code }) => !code)
    .flatMap(({ line }) => line.split(/\s+/))
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;

// The items of the list under "## Example prompts", with each item's wrapped lines joined by a space.
function examplePrompts(markdown) {
  const prompts = [];
  let section = false;
  let open = false;
  for (const { line, code } of markdownLines(markdown)) {
    if (code) {
      open = false;
      continue;
    }
    if (/^#{1,6}\s/.test(line)) {
      section = /^##\s+Example prompts\s*$/.test(line);
      open = false;
      continue;
    }
    if (!section) continue;
    const item = line.match(/^(?:[-*+]|\d+[.)])\s+(\S.*)$/);
    if (item) {
      prompts.push(item[1].trim());
      open = true;
    } else if (open && /^\s+\S/.test(line)) {
      prompts[prompts.length - 1] += ` ${line.trim()}`;
    } else {
      open = false;
    }
  }
  return prompts;
}

// Every entry under a folder, without following links.
function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    yield { path, entry };
    if (entry.isDirectory()) yield* walk(path);
  }
}

// Every file under plugins/ is a regular file, not a system file; an image is an SVG or a PNG; any other file is under
// 256 KiB. Returns the files, relative to the repository.
function checkFiles() {
  const files = [];
  for (const { path, entry } of walk(PLUGINS)) {
    const file = rel(path);
    const extension = extname(entry.name).toLowerCase();
    if (STRAY.includes(entry.name)) problem(file, "is a system file: delete it");
    else if (entry.isSymbolicLink()) problem(file, "is a symbolic link: the directories take regular files only");
    else if (entry.isDirectory()) continue;
    else if (!entry.isFile()) problem(file, "isn't a regular file");
    else if (OTHER_IMAGES.includes(extension)) problem(file, "is an image other than SVG or PNG");
    else if (!IMAGES.includes(extension) && lstatSync(path).size >= MAX_BYTES) problem(file, "must be under 256 KiB");
    else files.push(file);
  }
  return files;
}

// A plugin's plugin.json: the portable schema's keys, the same shared fields and display name as its
// .claude-plugin/plugin.json, and OpenAI's interface within its limits. Returns the interface.
function checkManifests(name, dir) {
  const file = `plugins/${name}/plugin.json`;
  const manifest = readJson(join(dir, "plugin.json"));
  const claude = readJson(join(dir, ".claude-plugin", "plugin.json"));
  if (manifest === undefined || claude === undefined) return undefined;

  for (const key of Object.keys(manifest)) {
    if (!KEYS.includes(key)) problem(file, `"${key}" isn't a key of the portable schema`);
  }
  for (const key of KEYS) if (!(key in manifest)) problem(file, `"${key}" is required`);
  if (manifest.$schema !== SCHEMA) problem(file, `$schema must be ${SCHEMA}`);
  if (manifest.name !== name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || chars(name) > 64) {
    problem(file, `name must be "${name}", its folder's name, in kebab-case and at most 64 characters`);
  }
  if (!isText(manifest.description, 4000)) problem(file, "description must be text of at most 4,000 characters");
  if (!isObject(manifest.author) || !isText(manifest.author.name, 120)) {
    problem(file, "author.name must be text of at most 120 characters");
  } else {
    for (const key of Object.keys(manifest.author)) {
      if (!AUTHOR_KEYS.includes(key)) problem(file, `"author.${key}" isn't a key of the portable schema`);
    }
  }
  if (!isTextList(manifest.keywords)) problem(file, "keywords must be a list of text");
  for (const key of SHARED) {
    if (!isDeepStrictEqual(manifest[key], claude[key])) {
      problem(file, `${key} must be the same as in plugins/${name}/.claude-plugin/plugin.json`);
    }
  }

  const ui = manifest.extensions?.["com.openai"]?.interface;
  if (!isObject(ui)) {
    problem(file, 'extensions."com.openai".interface is required');
    return undefined;
  }
  for (const [key, limit] of Object.entries(TEXT_LIMITS)) {
    if (!isText(ui[key], limit)) problem(file, `interface.${key} must be text of at most ${limit} characters`);
  }
  if (ui.displayName !== claude.displayName) {
    problem(file, `interface.displayName must be the same as displayName in plugins/${name}/.claude-plugin/plugin.json`);
  }
  for (const key of ["developerName", "category"]) if (!isText(ui[key])) problem(file, `interface.${key} is required`);
  if (!isTextList(ui.capabilities)) problem(file, "interface.capabilities must be a list of text");

  const links = [["homepage", manifest.homepage], ["repository", manifest.repository]];
  if (isObject(manifest.author) && "url" in manifest.author) links.push(["author.url", manifest.author.url]);
  for (const key of LINKS) links.push([`interface.${key}`, ui[key]]);
  for (const [key, value] of links) if (!isHttps(value)) problem(file, `${key} must be an https:// URL`);
  if (ui.websiteURL !== manifest.homepage) problem(file, "interface.websiteURL must be the same as homepage");

  const prompts = ui.defaultPrompt;
  if (
    !Array.isArray(prompts) ||
    prompts.length !== PROMPTS ||
    new Set(prompts).size !== PROMPTS ||
    !prompts.every((prompt) => isText(prompt, PROMPT_LIMIT) && !prompt.includes("@"))
  ) {
    problem(
      file,
      `interface.defaultPrompt must be ${PROMPTS} different prompts of at most ${PROMPT_LIMIT} characters, with no @`,
    );
  }

  if (typeof ui.brandColor !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(ui.brandColor)) {
    problem(file, "interface.brandColor must be a colour as #RRGGBB");
  } else {
    const contrast = contrastWithWhite(ui.brandColor);
    if (contrast < MIN_CONTRAST) {
      problem(file, `interface.brandColor has ${contrast.toFixed(2)}:1 contrast with white, under ${MIN_CONTRAST}:1`);
    }
    colours.push(`${name} ${ui.brandColor} ${contrast.toFixed(2)}:1`);
  }
  checkIcon(dir, file, "composerIcon", ui.composerIcon);
  checkIcon(dir, file, "logo", ui.logo);
  return ui;
}

// A plugin's README.md: at least 40 words outside code; no bundled image named anywhere but in Markdown image syntax;
// the icon shown; the listing's prompts first under "## Example prompts"; and its support and privacy links.
function checkReadme(name, dir, ui, files) {
  const file = `plugins/${name}/README.md`;
  const readme = read(join(dir, "README.md"), "utf8");
  if (readme === undefined) return;
  const words = proseWords(readme);
  if (words < MIN_WORDS) problem(file, `has ${words} words outside code blocks, under ${MIN_WORDS}`);

  const prefix = `plugins/${name}/`;
  const images = files
    .filter((path) => path.startsWith(prefix) && IMAGES.includes(extname(path).toLowerCase()))
    .map((path) => path.slice(prefix.length));
  for (const { line, code } of markdownLines(readme)) {
    const text = code ? line : line.replace(IMAGE, "");
    for (const image of images) {
      if (text.includes(image)) problem(file, `names ${image} outside Markdown image syntax: ${line.trim()}`);
    }
  }
  if (ui === undefined) return;

  const logo = typeof ui.logo === "string" ? ui.logo.replace(/^\.\//, "") : undefined;
  const shown = [...readme.matchAll(IMAGE)].map((match) => match[1].replace(/^\.\//, ""));
  if (logo !== undefined && !shown.includes(logo)) problem(file, `must show the icon as a Markdown image: ![…](${logo})`);
  const prompts = examplePrompts(readme);
  if (prompts.length < PROMPTS) {
    problem(file, `needs at least ${PROMPTS} example prompts, in a list under "## Example prompts"`);
  } else if (!isDeepStrictEqual(prompts.slice(0, PROMPTS), ui.defaultPrompt)) {
    problem(file, `its first ${PROMPTS} example prompts must be plugin.json's interface.defaultPrompt, in order`);
  }
  for (const key of ["supportURL", "privacyPolicyURL"]) {
    if (isText(ui[key]) && !readme.includes(ui[key])) problem(file, `must link interface.${key}, ${ui[key]}`);
  }
}

function checkLicense(name, dir) {
  const license = read(join(dir, "LICENSE"));
  if (license !== undefined && !license.equals(ROOT_LICENSE)) {
    problem(`plugins/${name}/LICENSE`, "must be a copy of the root LICENSE, byte for byte");
  }
}

// Every package that a skill or a README launches with npx, bunx, pnpm dlx or yarn dlx names one exact version, the
// same everywhere, and every other mention of that package with a version names the same one. Returns the pins.
function checkLaunchers(files) {
  const texts = [
    ...files.filter((file) => /^plugins\/[^/]+\/(?:skills\/[^/]+\/SKILL\.md|README\.md)$/.test(file)),
    "README.md",
  ];
  const pins = new Map();
  for (const file of texts) {
    const text = readFileSync(join(ROOT, file), "utf8");
    for (const match of text.matchAll(LAUNCHER)) {
      const target = match[1].replace(/[.,;:!?]+$/, "");
      const pinned = target.match(PINNED);
      if (pinned === null) {
        problem(file, `launches ${target}: name one exact version, as <package>@<x.y.z>`);
        continue;
      }
      const [, pkg, version] = pinned;
      if (pins.has(pkg) && pins.get(pkg) !== version) {
        problem(file, `launches ${pkg}@${version}, but another file launches ${pkg}@${pins.get(pkg)}`);
      } else {
        pins.set(pkg, version);
      }
    }
  }
  for (const file of texts) {
    const text = readFileSync(join(ROOT, file), "utf8");
    for (const [pkg, version] of pins) {
      const mention = new RegExp(`(?<![\\w@/.-])${escape(pkg)}@(\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?)`, "g");
      for (const match of text.matchAll(mention)) {
        if (match[1] !== version) problem(file, `names ${pkg}@${match[1]}, but ${pkg}@${version} is the one launched`);
      }
    }
  }
  return pins;
}

const files = checkFiles();
const names = readdirSync(PLUGINS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
for (const name of names) {
  const dir = join(PLUGINS, name);
  const ui = checkManifests(name, dir);
  checkReadme(name, dir, ui, files);
  checkLicense(name, dir);
}
const pins = checkLaunchers(files);

if (problems.length > 0) {
  for (const text of problems) console.error(`error: ${text}`);
  process.exit(1);
}
const launched = [...pins].map(([pkg, version]) => `${pkg}@${version}`).join(", ") || "none";
console.log(
  `Listings: ${names.join(", ")}: plugin.json within the portable schema and OpenAI's limits, and matching ` +
    `.claude-plugin/plugin.json; brand colours ${colours.join(", ")} against white; icons, READMEs and licences in ` +
    `place; launchers pinned: ${launched}.`,
);
