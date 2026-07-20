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
const NO_TOOLS = 'Bash,Read,Write,Edit,MultiEdit,NotebookEdit,WebFetch,WebSearch,Glob,Grep,Task,TodoWrite';

/**
 * Run one headless prompt and return the model's text answer.
 * Uses `--output-format json` and reads the `result` field from the envelope.
 */
function runClaude(prompt: string, model: string): string {
  const stdout = execFileSync(
    config.claudeBin,
    [
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
    ],
    {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024},
  );

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
    `Requirements:\n` +
    `- A single-page static web app. index.html at the root, plus any css/js/asset files.\n` +
    `- Vanilla HTML/CSS/JS ONLY. No frameworks, no bundler, no npm, no CDN <script>/<link> to external hosts, ` +
    `no fetch to external APIs. Everything must work fully offline from file://.\n` +
    `- Polished, responsive, works on mobile. Include a short title + one-line explanation on the page.\n` +
    `- Self-contained and safe: no eval of remote code, no user secrets.\n` +
    `- Tasteful, minimal aesthetic. It will be screenshotted for a portfolio.\n\n` +
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
