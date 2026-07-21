/**
 * Central config for the monthly project generator.
 * Everything is overridable via env so the same script runs locally,
 * in `--dry-run`, and in GitHub Actions.
 */
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Directory of the generator itself (scripts/generate-project). */
export const scriptDir = here;
export const repoRoot = path.resolve(here, '..', '..');

export const config = {
  /** GCP project the generated demos are deployed to. */
  gcpProject: process.env.GCP_PROJECT ?? 'leebot-dev',
  /** Cloud Run region. */
  gcpRegion: process.env.GCP_REGION ?? 'europe-west2',

  /**
   * "owner/repo" the generated source is committed to — used to build the
   * public "view source" link. GITHUB_REPOSITORY is set automatically in CI.
   */
  repoSlug: process.env.GITHUB_REPOSITORY ?? 'alternative-dl/react-resume',
  /** Branch the merged source lands on (the source link points here). */
  sourceBranch: process.env.SOURCE_BRANCH ?? 'main',
  /**
   * Generation runs through the Claude Code CLI (headless), authenticated with
   * a Max-subscription token (CLAUDE_CODE_OAUTH_TOKEN) rather than a paid API
   * key — so usage draws from the Max plan instead of per-token API billing.
   */
  claudeBin: process.env.CLAUDE_BIN ?? 'claude',
  /** Model that writes the app. Opus for quality. */
  claudeModel: process.env.CLAUDE_MODEL ?? 'claude-opus-4-8',
  /** Model that brainstorms the idea (a cheaper tier is fine). */
  claudeIdeaModel: process.env.CLAUDE_IDEA_MODEL ?? 'claude-haiku-4-5',

  /** Where generated app sources are written (one folder per project). */
  generatedAppsDir: path.join(repoRoot, 'generated-projects'),
  /** Machine-owned manifest of every generated project. */
  manifestPath: path.join(repoRoot, 'src', 'data', 'generatedProjects.json'),
  /** Auto-generated TS module consumed by data.tsx. */
  generatedModulePath: path.join(repoRoot, 'src', 'data', 'generatedProjects.ts'),
  /** Portfolio thumbnails live alongside the curated ones. */
  imagesDir: path.join(repoRoot, 'src', 'images', 'portfolio'),

  /** When true: no API calls, no gcloud, no live URL — use the bundled example app. */
  dryRun: process.argv.includes('--dry-run') || process.env.DRY_RUN === '1',
} as const;

export type ProjectRecord = {
  slug: string;
  title: string;
  description: string;
  url: string;
  sourceUrl: string; // public link to the generated source (GitHub folder)
  image: string; // filename inside imagesDir
  createdAt: string; // ISO date, passed in (scripts can't call Date.now deterministically in CI logs)
};
