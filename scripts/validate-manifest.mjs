#!/usr/bin/env node
/**
 * Zero-dependency consistency checks for the dsh-sidebar-home DSH plugin bundle.
 *
 * These are the invariants that a hand edit is most likely to break and that DSH
 * relies on to load the bundle at all: one package identity shared by the package
 * manifest, the browser module id and the Loader patch row, plus every exported and
 * packed runtime file actually existing.
 *
 * Usage: node scripts/validate-manifest.mjs
 * Exits 0 when consistent, 1 with a list of problems otherwise.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXPECTED_NAME = 'dsh-sidebar-home';
const ICON_LIMIT_BYTES = 256 * 1024;
/** Runtime files a DSH install needs on disk. */
const REQUIRED_FILES = [
  'index.js',
  'client.js',
  'cordis.patch.yml',
  'icon.svg',
  'locale/en.json',
  'locale/zh.json',
];
/** Export subpaths the DSH bundle loader resolves. */
const REQUIRED_EXPORTS = ['./client', './icon', './locale/*.json'];
const REQUIRED_LOCALES = ['locale/en.json', 'locale/zh.json'];

const problems = [];
const fail = (message) => problems.push(message);

/** Read and parse a JSON file, recording a problem instead of throwing. */
function readJson(relative) {
  const text = readText(relative);
  if (text === undefined) return undefined;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${relative} is not valid JSON: ${error.message}`);
    return undefined;
  }
}

/** Read a text file, recording a problem instead of throwing. */
function readText(relative) {
  try {
    return readFileSync(join(ROOT, relative), 'utf8');
  } catch (error) {
    fail(`${relative} is missing or unreadable: ${error.message}`);
    return undefined;
  }
}

function finish() {
  if (problems.length > 0) {
    console.error(`validate-manifest: ${problems.length} problem(s)`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  console.log(`validate-manifest: ok (${pkg.name}@${pkg.version})`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// package.json
// ---------------------------------------------------------------------------
const pkg = readJson('package.json');
if (pkg === undefined || typeof pkg !== 'object' || pkg === null) {
  fail('package.json must contain a JSON object');
  finish();
}

if (pkg.name !== EXPECTED_NAME) {
  fail(`package.json name is ${JSON.stringify(pkg.name)}, expected ${JSON.stringify(EXPECTED_NAME)}`);
}
if (typeof pkg.version !== 'string' || pkg.version.trim() === '') {
  fail('package.json version is missing');
}

// ---------------------------------------------------------------------------
// dsh bundle declaration
// ---------------------------------------------------------------------------
const patchPath = pkg.dsh?.bundle?.patch;
if (typeof patchPath !== 'string' || patchPath.trim() === '') {
  fail('package.json dsh.bundle.patch is missing');
} else if (!existsSync(join(ROOT, patchPath))) {
  fail(`dsh.bundle.patch points at a missing file: ${patchPath}`);
}

if (pkg.dsh?.client === undefined || pkg.dsh?.client === null) {
  fail('package.json dsh.client is missing');
} else if (pkg.dsh.client.platform !== 'web') {
  fail(`dsh.client.platform is ${JSON.stringify(pkg.dsh.client.platform)}, expected "web"`);
}

// The Loader patch must insert a row whose module name is the package name.
if (typeof patchPath === 'string' && existsSync(join(ROOT, patchPath))) {
  const patchText = readText(patchPath);
  const rows = patchText === undefined ? [] : [...patchText.matchAll(/^\s*name:\s*['"]?([^'"\s]+)['"]?\s*$/gm)].map((match) => match[1]);
  const expectedName = typeof pkg.name === 'string' ? pkg.name : EXPECTED_NAME;
  if (!rows.includes(expectedName)) {
    fail(`${patchPath} does not insert a row named ${JSON.stringify(expectedName)} (found: ${rows.join(', ') || 'none'})`);
  }
}

// ---------------------------------------------------------------------------
// exports and packed files
// ---------------------------------------------------------------------------
const exportsField = pkg.exports;
if (exportsField === undefined || typeof exportsField !== 'object' || exportsField === null) {
  fail('package.json exports is missing');
} else {
  for (const subpath of REQUIRED_EXPORTS) {
    if (exportsField[subpath] === undefined) {
      fail(`package.json exports is missing ${JSON.stringify(subpath)}`);
    }
  }
  for (const [subpath, target] of Object.entries(exportsField)) {
    if (typeof target !== 'string' || target.includes('*')) continue;
    if (!existsSync(join(ROOT, target))) {
      fail(`exports[${JSON.stringify(subpath)}] points at a missing file: ${target}`);
    }
  }
}

// `files` is what a packed install (and the loader's file list) can see.
const packed = Array.isArray(pkg.files) ? pkg.files : undefined;
if (packed === undefined) {
  fail('package.json files is missing');
} else {
  const matchesPackEntry = (file, entry) => {
    const escaped = entry
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('[^/]*');
    return new RegExp(`^${escaped}$`).test(file);
  };
  for (const file of REQUIRED_FILES) {
    if (!packed.some((entry) => matchesPackEntry(file, entry))) {
      fail(`package.json files does not include the required runtime file ${file}`);
    }
    if (!existsSync(join(ROOT, file))) {
      fail(`required runtime file is missing on disk: ${file}`);
    }
  }
}

// ---------------------------------------------------------------------------
// browser module identity
// ---------------------------------------------------------------------------
const clientText = readText('client.js');
if (clientText !== undefined) {
  if (!/^\uFEFF?\s*window\.__ModuleLoader__\.load\(\s*\{/.test(clientText)) {
    fail('client.js does not start with window.__ModuleLoader__.load({');
  }
  const idMatch = /__ModuleLoader__\s*\.\s*load\(\s*\{\s*id\s*:\s*(['"])([^'"]+)\1/.exec(clientText);
  if (idMatch === null) {
    fail('client.js does not declare an id in window.__ModuleLoader__.load({ id: ... })');
  } else {
    const expectedName = typeof pkg.name === 'string' ? pkg.name : EXPECTED_NAME;
    if (idMatch[2] !== expectedName) {
      fail(`client.js module id is ${JSON.stringify(idMatch[2])}, expected the package name ${JSON.stringify(expectedName)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Plugin Manager display metadata
// ---------------------------------------------------------------------------
for (const localeFile of REQUIRED_LOCALES) {
  const locale = readJson(localeFile);
  if (locale === undefined) continue;
  const meta = locale.meta;
  if (typeof meta?.title !== 'string' || meta.title.trim() === '') {
    fail(`${localeFile} meta.title is missing`);
  }
  if (typeof meta?.description !== 'string' || meta.description.trim() === '') {
    fail(`${localeFile} meta.description is missing`);
  }
}

// ---------------------------------------------------------------------------
// icon and smoke test
// ---------------------------------------------------------------------------
if (!existsSync(join(ROOT, 'icon.svg'))) {
  fail('icon.svg is missing');
} else {
  const { size } = statSync(join(ROOT, 'icon.svg'));
  if (size === 0) fail('icon.svg is empty');
  if (size >= ICON_LIMIT_BYTES) {
    fail(`icon.svg is ${size} bytes; DSH accepts icons smaller than ${ICON_LIMIT_BYTES} bytes (256 KiB)`);
  }
}

if (!existsSync(join(ROOT, 'test/render-smoke.cjs'))) {
  fail('test/render-smoke.cjs is missing (the zero-dependency render smoke test)');
}

finish();
