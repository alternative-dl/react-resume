# Monthly project generator

Every month a GitHub Action asks Claude to invent and build a small,
self-contained web demo, deploys it to **Cloud Run** on `leebot-dev`,
screenshots it, and opens a **pull request** adding it to the portfolio.
You review the PR (Vercel builds a preview) and merge to publish.

Generation runs through the **Claude Code CLI (headless)**, authenticated with a
**Max-subscription token** (`CLAUDE_CODE_OAUTH_TOKEN`) — so it draws from the Max
plan instead of per-token API billing. No `ANTHROPIC_API_KEY` is used.

```
idea (Claude)  ─▶  static app (Claude)  ─▶  Cloud Run deploy  ─▶  screenshot
                                                                     │
                          data.tsx  ◀──  generatedProjects.ts  ◀─────┘
```

This is an **isolated mini-package** — it has its own `package.json` and never
touches the Next app's dependencies.

**Models:** the app is written by **Opus** (`CLAUDE_MODEL`, default `claude-opus-4-8`);
**Haiku** (`CLAUDE_IDEA_MODEL`) only brainstorms the one-line idea. So polish is
driven by the design brief in `claude.ts`'s `generateApp` prompt, not the model
tier — the brief pins each demo to the resume's **digital-brutalism** look
(paper/ink/signal palette, thick borders, hard offset shadows, mono + heavy
display type) using system fonts (no web fonts — apps must run offline).

## Files

| File | Role |
| --- | --- |
| `generate.ts` | Orchestrator (idea → app → deploy → screenshot → data) |
| `claude.ts` | Headless Claude Code CLI calls (idea + app generation) |
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

# Real run — needs the `claude` CLI logged in (or CLAUDE_CODE_OAUTH_TOKEN set)
# and gcloud auth with deploy rights.
npm install -g @anthropic-ai/claude-code   # if not already installed
GCP_PROJECT=leebot-dev npm run generate
```

After a run, reset dry-run artifacts with `git checkout` / `git clean` if you
don't want to keep them.

## One-time setup (required before the cron works)

1. **GCP** — run the helper as an owner of `leebot-dev`:
   ```bash
   cd scripts/generate-project
   REPO="alternative-dl/react-resume" ./setup-gcp.sh
   ```
   It prints the two GCP GitHub secrets to add.

2. **Claude subscription token** — mint one from your Max login:
   ```bash
   claude setup-token
   ```
   Copy the printed token into the `CLAUDE_CODE_OAUTH_TOKEN` secret below.

3. **GitHub secrets** (Settings → Secrets and variables → Actions):
   - `CLAUDE_CODE_OAUTH_TOKEN` — from `claude setup-token` (draws on your Max plan)
   - `GCP_WORKLOAD_IDENTITY_PROVIDER`
   - `GCP_SERVICE_ACCOUNT`
   - optional repo *variables*: `GCP_PROJECT`, `GCP_REGION`
   - Do **not** set `ANTHROPIC_API_KEY` — it would override the subscription
     token and bill per-token.

4. Trigger a first run manually from the **Actions → Monthly project → Run workflow**
   button to confirm the pipeline before waiting for the cron.

## Guardrails

- Generated apps are **static only** (HTML/CSS/vanilla JS, no servers, no secrets,
  no external network) — bounds cost and attack surface.
- The container `Dockerfile` is **fixed and human-owned**; the model never writes
  container or infra config.
- Nothing publishes automatically — every project lands as a reviewable PR.
- Each generated Cloud Run service is named `demo-<slug>` and stays up; prune old
  ones from the Cloud Run console if they accumulate.

## Source links & Cloud Run sizing

- The generated source is committed to `generated-projects/<slug>/` and each
  portfolio card exposes a **"Code"** link (`ProjectRecord.sourceUrl`) pointing at
  that folder on GitHub — built from `GITHUB_REPOSITORY` + `SOURCE_BRANCH` (`main`).
- Demos deploy with a **lean, cost-bounded** Cloud Run config (see `deploy.ts`):
  `--memory=128Mi --cpu=0.5 --min-instances=0 --max-instances=1 --concurrency=80
  --timeout=30`. CPU is request-throttled by default, so with scale-to-zero an
  idle demo bills nothing and a single small instance serves the traffic these get.
