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
import {pickIdea, generateApp} from './claude';
import {config, ProjectRecord} from './config';
import {deploy, screenshot, writeApp} from './deploy';
import {readManifest, regenerateModule, writeManifest} from './manifest';

async function main() {
  const runDate = process.env.RUN_DATE ?? new Date().toISOString().slice(0, 10);
  const manifest = readManifest();

  console.log(`▶ Generating monthly project (${config.dryRun ? 'DRY RUN' : 'live'})`);

  const idea = await pickIdea(manifest.map(p => p.title));
  console.log(`  idea: ${idea.title} — ${idea.description}`);

  if (manifest.some(p => p.slug === idea.slug)) {
    throw new Error(`Slug "${idea.slug}" already exists in the manifest; aborting to avoid a collision.`);
  }

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

main().catch(err => {
  console.error('✗ Generation failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
