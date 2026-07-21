/**
 * Writes a generated app to disk, deploys it to Cloud Run (source-based build),
 * and screenshots the result for the portfolio thumbnail.
 *
 * In --dry-run: no gcloud, no live URL. We still write the files and screenshot
 * them from a file:// URL so the whole pipeline is exercised end-to-end.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

import {config} from './config';
import {GeneratedFile, Idea} from './claude';

/** A fixed, human-controlled Dockerfile — the model never writes container config. */
const DOCKERFILE = `FROM nginx:alpine
COPY app /usr/share/nginx/html
# Cloud Run provides $PORT; make nginx listen on it.
RUN sed -i 's/listen\\s*80;/listen 8080;/' /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
`;

export function writeApp(idea: Idea, files: GeneratedFile[]): string {
  const appDir = path.join(config.generatedAppsDir, idea.slug);
  const staticDir = path.join(appDir, 'app');
  fs.rmSync(appDir, {recursive: true, force: true});
  fs.mkdirSync(staticDir, {recursive: true});

  for (const file of files) {
    const rel = file.path.replace(/^\.\//, '');
    if (rel.includes('..') || path.isAbsolute(rel)) throw new Error(`Unsafe file path: ${file.path}`);
    const dest = path.join(staticDir, rel);
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.writeFileSync(dest, file.content, 'utf8');
  }
  fs.writeFileSync(path.join(appDir, 'Dockerfile'), DOCKERFILE, 'utf8');
  return appDir;
}

export function deploy(idea: Idea, appDir: string): string {
  if (config.dryRun) return pathToFileURL(path.join(appDir, 'app', 'index.html')).href;

  const service = `demo-${idea.slug}`.slice(0, 49); // Cloud Run name limit
  execFileSync(
    'gcloud',
    [
      'run',
      'deploy',
      service,
      `--source=${appDir}`,
      `--project=${config.gcpProject}`,
      `--region=${config.gcpRegion}`,
      '--allow-unauthenticated',
      '--port=8080',
      // These are tiny static nginx sites, so run them as lean as Cloud Run
      // allows: 128Mi is the memory floor, and scale-to-zero (min=0) means an
      // idle demo costs nothing. CPU is throttled to request time by default,
      // so 1 vCPU is only ever billed while actually serving a request.
      // (Cloud Run rejects fractional CPU unless concurrency is 1, so keep 1.)
      '--memory=128Mi',
      '--cpu=1',
      '--min-instances=0',
      '--max-instances=1',
      '--concurrency=80',
      '--timeout=30',
      '--quiet',
    ],
    {stdio: 'inherit'},
  );

  const url = execFileSync(
    'gcloud',
    [
      'run',
      'services',
      'describe',
      service,
      `--project=${config.gcpProject}`,
      `--region=${config.gcpRegion}`,
      '--format=value(status.url)',
    ],
    {encoding: 'utf8'},
  ).trim();

  if (!url) throw new Error(`Could not resolve Cloud Run URL for ${service}`);
  return url;
}

/** Screenshot the deployed (or file://) app into imagesDir. Returns the filename. */
export async function screenshot(idea: Idea, url: string): Promise<string> {
  // Imported lazily so the rest of the pipeline doesn't need Playwright installed.
  const {chromium} = await import('playwright');
  const filename = `generated-${idea.slug}.png`;
  const dest = path.join(config.imagesDir, filename);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 800}, deviceScaleFactor: 2});
    await page.goto(url, {waitUntil: 'networkidle', timeout: 60_000});
    await page.waitForTimeout(1500); // let animations/canvas settle
    await page.screenshot({path: dest});
  } finally {
    await browser.close();
  }
  return filename;
}
