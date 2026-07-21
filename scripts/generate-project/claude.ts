/**
 * Generation via the Claude Code CLI (headless), NOT the paid Anthropic API.
 *
 * We shell out to `claude -p` authenticated with a Max-subscription token
 * (CLAUDE_CODE_OAUTH_TOKEN), so idea + app generation draw from the Max plan
 * instead of per-token API billing. Two calls: (1) brainstorm an idea,
 * (2) write a self-contained static web app. Each asks for a strict JSON
 * payload, which we extract and validate ourselves (headless Claude Code
 * returns free-form text, so there's no forced-tool schema like the API has).
 *
 * In --dry-run these are replaced by the bundled example app (no CLI, no auth).
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {config, scriptDir} from './config';

export type Idea = {slug: string; title: string; description: string};
export type GeneratedFile = {path: string; content: string};

/** Tools we never want the model to touch — this is a pure text generation. */
const NO_TOOLS = 'Bash,Read,Write,Edit,NotebookEdit,WebFetch,WebSearch,Glob,Grep,Task,TodoWrite';

/**
 * Run one headless prompt and return the model's text answer.
 * Uses `--output-format json` and reads the `result` field from the envelope.
 */
function runClaude(prompt: string, model: string): string {
  // Force the subscription auth path: an ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN
  // in the environment (even empty) shadows the logged-in / CLAUDE_CODE_OAUTH_TOKEN
  // credential and makes `claude` fail with an auth error. Strip both.
  const env = {...process.env};
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_AUTH_TOKEN;

  const args = [
    '-p',
    prompt,
    '--output-format',
    'json',
    '--model',
    model,
    '--disallowedTools',
    NO_TOOLS,
    '--append-system-prompt',
    'You are a code generator invoked non-interactively. Reply with ONLY the requested JSON — no prose, no explanation, no markdown fences unless asked.',
  ];

  let stdout: string;
  try {
    stdout = execFileSync(config.claudeBin, args, {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env});
  } catch (e) {
    // execFileSync swallows the child's stderr into the error object — surface it,
    // otherwise all we get is a useless "Command failed" with no reason.
    const err = e as {status?: number; stderr?: string | Buffer; stdout?: string | Buffer};
    const stderr = (err.stderr ?? '').toString().trim();
    const out = (err.stdout ?? '').toString().trim();
    const combined = `${stderr}\n${out}`.toLowerCase();
    const hint =
      combined.includes('401') || combined.includes('invalid bearer') || combined.includes('failed to authenticate')
        ? '\n  hint: CLAUDE_CODE_OAUTH_TOKEN is present but rejected (401). Regenerate it with `claude setup-token` and update the GitHub secret with the exact value (starts with sk-ant-oat01-, no quotes/newline).'
        : !env.CLAUDE_CODE_OAUTH_TOKEN
          ? '\n  hint: CLAUDE_CODE_OAUTH_TOKEN is not set — in CI this must be a repo secret from `claude setup-token`.'
          : '';
    throw new Error(
      `\`${config.claudeBin}\` exited ${err.status ?? '?'}.` +
        `\n  stderr: ${stderr || '(empty)'}` +
        `\n  stdout: ${out.slice(0, 800) || '(empty)'}` +
        hint,
    );
  }

  const envelope = JSON.parse(stdout) as {
    is_error?: boolean;
    result?: string;
    // older/alternate shapes, parsed defensively:
    content?: Array<{text?: string}>;
    text?: string;
    subtype?: string;
  };
  if (envelope.is_error) {
    throw new Error(`Claude Code returned an error (${envelope.subtype ?? 'unknown'})`);
  }
  const text = envelope.result ?? envelope.content?.[0]?.text ?? envelope.text;
  if (!text) throw new Error('Claude Code returned no text result');
  return text;
}

/** Pull a JSON value out of the model's text (raw, or inside a ```json fence). */
function extractJson<T>(text: string): T {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : trimmed;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    // Fall back to the first balanced object/array in the text.
    const start = candidate.search(/[[{]/);
    const end = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'));
    if (start !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1)) as T;
    }
    throw new Error(`Could not parse JSON from Claude output:\n${text.slice(0, 500)}`);
  }
}

export function pickIdea(recentTitles: string[]): Idea {
  if (config.dryRun) return readExampleIdea();

  const prompt =
    `Invent ONE small but genuinely impressive personal project for the portfolio of Didrik Liu, ` +
    `a Data Analyst & AI Engineer. It must be buildable as a single-page, fully static web app ` +
    `(HTML/CSS/vanilla JS only — no backend, no build step, no external network calls). ` +
    `Favour interactive data/AI-flavoured toys: visualizations, algorithm demos, generative art, simulations.\n\n` +
    `Do NOT repeat any of these existing projects:\n${recentTitles.map(t => `- ${t}`).join('\n') || '(none yet)'}\n\n` +
    `Reply with ONLY this JSON object:\n` +
    `{"slug": "kebab-case, <=30 chars, url-safe", "title": "punchy, <=45 chars", "description": "one sentence, <=140 chars"}`;

  const idea = extractJson<Idea>(runClaude(prompt, config.claudeIdeaModel));
  if (!idea.slug || !idea.title || !idea.description) {
    throw new Error(`Idea is missing required fields: ${JSON.stringify(idea)}`);
  }
  return idea;
}

export function generateApp(idea: Idea): GeneratedFile[] {
  if (config.dryRun) return readExampleFiles();

  const prompt =
    `Build "${idea.title}": ${idea.description}\n\n` +
    `This ships to the portfolio of Didrik Liu next to his hand-crafted work, so the bar is high: ` +
    `it must look intentionally designed, not like a default demo. Sweat the details.\n\n` +
    `TECHNICAL CONSTRAINTS (hard):\n` +
    `- A single-page static web app. index.html at the root, plus any css/js/asset files.\n` +
    `- Vanilla HTML/CSS/JS ONLY. No frameworks, no bundler, no npm, no CDN <script>/<link> to external hosts, ` +
    `no web fonts, no fetch to external APIs. Everything must work fully offline from file://.\n` +
    `- Self-contained and safe: no eval of remote code, no user secrets.\n\n` +
    `DESIGN LANGUAGE — digital brutalism (match Didrik's resume site exactly):\n` +
    `- Palette, and ONLY these: paper #f5f1e8 (background), ink #0a0a0a (text, borders), ` +
    `signal #ff4d00 (one accent — use it sparingly and deliberately for emphasis, active states, key data). ` +
    `Flat fills only; no gradients, no soft/blurred drop-shadows, no rounded corners.\n` +
    `- Structure is the aesthetic: thick 3–4px solid ink borders on every card, control, and panel; ` +
    `hard offset shadows with NO blur, e.g. box-shadow: 6px 6px 0 0 #0a0a0a. High contrast everywhere.\n` +
    `- Type: system stacks only (no web fonts). Display/headings — a heavy sans stack ` +
    `("system-ui","Segoe UI",Roboto,Helvetica,Arial,sans-serif), bold or 800, UPPERCASE, tight letter-spacing. ` +
    `Labels/numbers/captions — a monospace stack (ui-monospace,"DejaVu Sans Mono","Courier New",monospace) ` +
    `with wide tracking. Establish a clear type scale; don't leave anything at browser defaults.\n` +
    `- Header: a bold UPPERCASE title plus a one-line explainer set as a small badge ` +
    `(ink border, signal or paper fill, mono text).\n` +
    `- Controls feel tactile: buttons/sliders/toggles are bordered blocks with a hard shadow that ` +
    `visibly "presses" on hover/active (translate a couple px toward the shadow and shrink it). ` +
    `Add clear :focus-visible outlines for keyboard use.\n` +
    `- Motion is subtle and purposeful only (e.g. a brief pop-in on load); never gratuitous.\n\n` +
    `CRAFT CHECKLIST (attention to detail — do all of these):\n` +
    `- Consistent spacing rhythm on a small scale (e.g. 4/8/16/24px); align edges to a grid; nothing cramped or off-by-a-pixel.\n` +
    `- Style EVERYTHING you use: inputs, buttons, and (minimally) scrollbars — no unstyled default widgets.\n` +
    `- Fully responsive; the layout must hold up and stay legible from ~360px wide up to desktop.\n` +
    `- Handle empty/initial/edge states gracefully (no blank screen, no errors before interaction).\n` +
    `- The app is auto-screenshotted at 1280×800 (2x) ~1.5s after load with no interaction: make that ` +
    `first paint visually complete and striking — show real content/state, not an empty canvas or a bare form.\n\n` +
    `Reply with ONLY this JSON object (no markdown fences):\n` +
    `{"files": [{"path": "index.html", "content": "..."}, ...]}\n` +
    `Every file the app needs must be included, and index.html must be at the root.`;

  const {files} = extractJson<{files: GeneratedFile[]}>(runClaude(prompt, config.claudeModel));
  if (!Array.isArray(files) || !files.length) {
    throw new Error('Generated app has no files');
  }
  if (!files.some(f => f.path.replace(/^\.\//, '') === 'index.html')) {
    throw new Error('Generated app is missing index.html at the root');
  }
  return files;
}

// --- dry-run fixtures -------------------------------------------------------

function readExampleIdea(): Idea {
  const raw = fs.readFileSync(path.join(scriptDir, 'example-app', 'idea.json'), 'utf8');
  return JSON.parse(raw) as Idea;
}

function readExampleFiles(): GeneratedFile[] {
  const dir = path.join(scriptDir, 'example-app');
  const files: GeneratedFile[] = [];
  for (const name of fs.readdirSync(dir)) {
    if (name === 'idea.json') continue;
    files.push({path: name, content: fs.readFileSync(path.join(dir, name), 'utf8')});
  }
  return files;
}
