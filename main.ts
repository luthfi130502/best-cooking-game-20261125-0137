// Ember & Thyme — Rush Hour Kitchen
// main.ts — the entrypoint. It hands the game in: it copies game/ and
// screenshots/ from this repository into the output directory and writes
// /output/dossier.json with buildDossier from the kit's library, so the
// gate can check the hand-in byte for byte against what the library
// writes from the same files.
//
// Run it as the grader does: `node main.ts` (Node 22 runs TypeScript
// as-is). Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the directory this file lives in.
const repoRoot = dirname(fileURLToPath(import.meta.url));

// The grader gives us a writable /output; a local run may point
// MAKEFUN_OUTPUT_DIR somewhere else instead.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps the bounty's gate grades against.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function clearEntry(path) {
  if (existsSync(path)) rmSync(path, { recursive: true, force: true });
}

function copyEntry(name) {
  const from = join(repoRoot, name);
  const to = join(outDir, name);
  if (!existsSync(from)) throw new Error(`missing in repository: ${name}/`);
  cpSync(from, to, { recursive: true });
}

// Hand the entry in. Clearing the three entries first keeps a repeated
// run byte-identical to a fresh one: stale files from an earlier run
// can never leak into the hand-in.
mkdirSync(outDir, { recursive: true });
clearEntry(join(outDir, 'game'));
clearEntry(join(outDir, 'screenshots'));
clearEntry(join(outDir, 'dossier.json'));

copyEntry('game');
copyEntry('screenshots');

// The dossier is built from what was just copied, so it always
// describes exactly the files being handed in.
const dossier = buildDossier(outDir, DOSSIER_CAPS);
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log(`Ember & Thyme handed in to ${outDir} (dossier.json: ${dossier.length} bytes).`);
