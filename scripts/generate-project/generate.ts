/**
 * Monthly project generator — orchestrates the whole loop:
 *   idea -> app code -> deploy to Cloud Run -> screenshot -> update portfolio data.
 *
 * It does NOT touch git; the GitHub Actions workflow commits the result and
 * opens a PR so nothing reaches the live resume without review.
 *
 * Usage:
 *   npx tsx scripts/generate-project/generate.ts            # real run (needs ANTHROPIC_API_KEY + gcloud auth)
 *   npx tsx scripts/generate-project/generate.ts --dry-run  # no API, no cloud; uses the bundled example app
 *
 * The run date is passed in (scripts can't read the clock in CI deterministically):
 *   RUN_DATE=2026-08-01 npx tsx scripts/generate-project/generate.ts
 */
import {Idea, pickIdea, generateApp} from './claude';
import {config, ProjectRecord} from './config';
import {readPendingProjects, tooSimilar} from './dedupe';
import {deploy, screenshot, writeApp} from './deploy';
import {readManifest, regenerateModule, writeManifest} from './manifest';

async function main() {
  const runDate = process.env.RUN_DATE ?? new Date().toISOString().slice(0, 10);
  const manifest = readManifest();

  console.log(`▶ Generating monthly project (${config.dryRun ? 'DRY RUN' : 'live'})`);

  // Projects that exist but aren't on main yet (unmerged bot PRs) must count
  // as taken too, otherwise two consecutive runs can build the same thing.
  const pending = config.dryRun ? [] : readPendingProjects('src/data/generatedProjects.json', new Set(manifest.map(p => p.slug)));
  if (pending.length) console.log(`  pending (unmerged PRs): ${pending.map(p => p.title).join(', ')}`);
  const existing = [...manifest, ...pending];

  const idea = pickDistinctIdea(existing);
  console.log(`  idea: ${idea.title} — ${idea.description}`);

  const files = await generateApp(idea);
  console.log(`  app: ${files.length} file(s) generated`);

  const appDir = writeApp(idea, files);
  const url = deploy(idea, appDir);
  console.log(`  url: ${url}`);

  const image = await screenshot(idea, url);
  console.log(`  shot: src/images/portfolio/${image}`);

  const sourceUrl = `https://github.com/${config.repoSlug}/tree/${config.sourceBranch}/generated-projects/${idea.slug}`;
  console.log(`  src: ${sourceUrl}`);

  const record: ProjectRecord = {
    slug: idea.slug,
    title: idea.title,
    description: idea.description,
    url,
    sourceUrl,
    image,
    createdAt: runDate,
  };

  const next = [...manifest, record];
  writeManifest(next);
  regenerateModule(next);

  console.log(`✓ Added "${idea.title}". Manifest now has ${next.length} project(s).`);
  console.log(config.dryRun ? '  (dry run — URL is a local file, not a live deploy)' : '  Ready to commit + open a PR.');
}

/**
 * Ask for an idea, reject it if it's too close to an existing project, and
 * re-ask (with the rejection fed back) up to MAX_IDEA_ATTEMPTS times.
 */
const MAX_IDEA_ATTEMPTS = 4;

function pickDistinctIdea(existing: ProjectRecord[]): Idea {
  const rejected: string[] = [];
  for (let attempt = 1; attempt <= MAX_IDEA_ATTEMPTS; attempt++) {
    const idea = pickIdea(existing, rejected);
    const slugTaken = existing.some(p => p.slug === idea.slug);
    const similar = tooSimilar(idea, existing);
    if (!slugTaken && !similar) return idea;

    const why = slugTaken
      ? `slug "${idea.slug}" already exists`
      : `too close to "${similar!.match.title}" (shared: ${similar!.shared.join(', ')})`;
    console.log(`  rejected idea ${attempt}/${MAX_IDEA_ATTEMPTS}: "${idea.title}" — ${why}`);
    if (config.dryRun) throw new Error(`Dry-run idea rejected: ${why}`);
    rejected.push(`${idea.title}: ${idea.description}`);
  }
  throw new Error(`Could not get a sufficiently novel idea after ${MAX_IDEA_ATTEMPTS} attempts; aborting.`);
}

main().catch(err => {
  console.error('✗ Generation failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
