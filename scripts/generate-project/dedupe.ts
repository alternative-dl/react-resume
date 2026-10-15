/**
 * Keeps the monthly generator from building the same thing twice.
 *
 * Two failure modes this guards against (both happened for real: Sep and Oct
 * 2026 produced "Decision Boundary Visualizer" and "Decision Boundary Explorer"):
 *
 * 1. The idea model only saw titles and read "do not repeat" as "do not reuse
 *    the exact title". `tooSimilar` is a deterministic backstop: it rejects an
 *    idea whose title/description shares its key terms with an existing project,
 *    and the orchestrator then re-asks with the rejected idea added to the
 *    avoid-list.
 *
 * 2. Each run only sees projects already merged to `main`. A bot PR left open
 *    for a month is invisible to the next run. `readPendingProjects` reads the
 *    manifest from every unmerged `bot/monthly-project-*` branch on the remote
 *    so those count as existing too.
 */
import {execFileSync} from 'node:child_process';

import {ProjectRecord, repoRoot} from './config';

export type ProjectSummary = Pick<ProjectRecord, 'title' | 'description'>;

/** Words that say nothing about *what* a demo is about — present in most of them. */
const GENERIC = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'with', 'as', 'at', 'by', 'from', 'into', 'your', 'you',
  'it', 'its', 'this', 'that', 'any', 'how', 'what', 'one', 'two', 'per', 'via',
  'interactive', 'interactively', 'explore', 'explorer', 'exploring', 'visualize', 'visualizer', 'visualization',
  'visualise', 'visualiser', 'visualisation', 'watch', 'see', 'show', 'showing', 'plot', 'plotting', 'draw', 'drawing',
  'live', 'real', 'time', 'realtime', 'demo', 'playground', 'simulator', 'simulation', 'simulate', 'tool', 'toy',
  'app', 'lab', 'studio', 'sandbox', 'engine', 'generator', 'builder', 'viewer', 'dashboard', 'canvas', 'web',
  'data', 'points', 'point', 'click', 'add', 'adding', 'drag', 'build', 'learn', 'learning', 'render', 'rendering',
  '2d', '3d', 'browser', 'javascript', 'js', 'vanilla', 'static',
]);

/** Lower-case, strip punctuation, drop generic/short words, crude-stem the rest. */
export function keyTerms(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 3 || GENERIC.has(raw)) continue;
    const stem = raw
      .replace(/ies$/, 'y')
      .replace(/(ing|ers|er|es|s)$/, '')
      .replace(/(ing|ers|er|es|s)$/, '');
    if (stem.length >= 3 && !GENERIC.has(stem)) out.add(stem);
  }
  return out;
}

function overlap(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter(t => b.has(t));
}

/**
 * Returns the existing project this idea is too close to, or null.
 * "Too close" = titles share 2+ key terms, or title+description share 3+.
 */
export function tooSimilar(idea: ProjectSummary, existing: ProjectSummary[]): {match: ProjectSummary; shared: string[]} | null {
  const ideaTitle = keyTerms(idea.title);
  const ideaAll = keyTerms(`${idea.title} ${idea.description}`);
  for (const p of existing) {
    const titleShared = overlap(ideaTitle, keyTerms(p.title));
    if (titleShared.length >= 2) return {match: p, shared: titleShared};
    const allShared = overlap(ideaAll, keyTerms(`${p.title} ${p.description}`));
    if (allShared.length >= 3) return {match: p, shared: allShared};
  }
  return null;
}

/**
 * Manifest entries from unmerged `bot/monthly-project-*` branches on origin —
 * projects that exist but haven't landed on main yet. Best-effort: any git
 * failure (no remote, dry-run offline, shallow clone quirks) yields [].
 */
export function readPendingProjects(manifestRelPath: string, except: Set<string>): ProjectRecord[] {
  const git = (...args: string[]) =>
    execFileSync('git', args, {cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();

  let refs: string[];
  try {
    refs = git('ls-remote', '--heads', 'origin', 'refs/heads/bot/monthly-project-*')
      .split('\n')
      .map(l => l.split('\t')[1])
      .filter(Boolean);
  } catch {
    return [];
  }

  const found: ProjectRecord[] = [];
  for (const ref of refs) {
    try {
      git('fetch', '--quiet', '--depth=1', 'origin', ref);
      const raw = git('show', `FETCH_HEAD:${manifestRelPath}`);
      for (const p of JSON.parse(raw) as ProjectRecord[]) {
        if (!except.has(p.slug) && !found.some(f => f.slug === p.slug)) found.push(p);
      }
    } catch {
      // branch without a manifest, or fetch failed — skip it
    }
  }
  return found;
}
