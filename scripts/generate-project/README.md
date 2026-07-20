# Monthly project generator

Every month a GitHub Action asks Claude to invent and build a small,
self-contained web demo, deploys it to **Cloud Run** on `leebot-dev`,
screenshots it, and opens a **pull request** adding it to the portfolio.
You review the PR (Vercel builds a preview) and merge to publish.

```
idea (Claude)  ─▶  static app (Claude)  ─▶  Cloud Run deploy  ─▶  screenshot
                                                                     │
                          data.tsx  ◀──  generatedProjects.ts  ◀─────┘
```

This is an **isolated mini-package** — it has its own `package.json` and never
touches the Next app's dependencies.

## Files

| File | Role |
| --- | --- |
| `generate.ts` | Orchestrator (idea → app → deploy → screenshot → data) |
| `anthropic.ts` | Claude calls (forced-tool structured output) |
| `deploy.ts` | Writes app + fixed nginx Dockerfile, `gcloud run deploy`, Playwright screenshot |
| `manifest.ts` | Owns `src/data/generatedProjects.json` + regenerates `generatedProjects.ts` |
| `config.ts` | Env-driven config |
| `example-app/` | Fixture used by `--dry-run` (no API, no cloud) |
| `setup-gcp.sh` | One-time GCP service account + Workload Identity setup |
| `../../.github/workflows/monthly-project.yml` | The monthly cron + PR |

Generated apps are written to `generated-projects/<slug>/` and committed with the PR.
`src/data/generatedProjects.ts` is **auto-generated — never edit it by hand.**

## How the portfolio consumes it

`src/data/data.tsx` spreads the generated list into `portfolioItems`:

```ts
import {generatedProjects} from './generatedProjects';
export const portfolioItems: PortfolioItem[] = [ ...curated, ...generatedProjects ];
```

Screenshots are committed to `src/images/portfolio/generated-<slug>.png` and
imported statically, so `next/image` keeps its blur placeholder like the
curated items.

## Local use

```bash
cd scripts/generate-project
npm install
npx playwright install chromium

# Dry run — no API key, no cloud. Uses example-app/, screenshots via file://.
npm run dry-run

# Real run — needs an Anthropic key and gcloud auth with deploy rights.
ANTHROPIC_API_KEY=sk-... GCP_PROJECT=leebot-dev npm run generate
```

After a run, reset dry-run artifacts with `git checkout` / `git clean` if you
don't want to keep them.

## One-time setup (required before the cron works)

1. **GCP** — run the helper as an owner of `leebot-dev`:
   ```bash
   cd scripts/generate-project
   REPO="alternative-dl/react-resume" ./setup-gcp.sh
   ```
   It prints the three GitHub secrets to add.

2. **GitHub secrets** (Settings → Secrets and variables → Actions):
   - `ANTHROPIC_API_KEY`
   - `GCP_WORKLOAD_IDENTITY_PROVIDER`
   - `GCP_SERVICE_ACCOUNT`
   - optional repo *variables*: `GCP_PROJECT`, `GCP_REGION`

3. Trigger a first run manually from the **Actions → Monthly project → Run workflow**
   button to confirm the pipeline before waiting for the cron.

## Guardrails

- Generated apps are **static only** (HTML/CSS/vanilla JS, no servers, no secrets,
  no external network) — bounds cost and attack surface.
- The container `Dockerfile` is **fixed and human-owned**; the model never writes
  container or infra config.
- Nothing publishes automatically — every project lands as a reviewable PR.
- Each generated Cloud Run service is named `demo-<slug>` and stays up; prune old
  ones from the Cloud Run console if they accumulate.
