/**
 * Claude calls that (1) brainstorm a fresh project idea and (2) write a
 * self-contained static web app. Structured output is forced via a tool call
 * so we get validated JSON, not prose to parse.
 *
 * In --dry-run these are replaced by the bundled example app (no API needed).
 */
import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import path from 'node:path';

import {config, scriptDir} from './config';

export type Idea = {slug: string; title: string; description: string};
export type GeneratedFile = {path: string; content: string};

const client = () => new Anthropic({apiKey: config.apiKey});

function forceTool<T>(content: Anthropic.Messages.ContentBlock[], toolName: string): T {
  const block = content.find(b => b.type === 'tool_use' && b.name === toolName);
  if (!block || block.type !== 'tool_use') {
    throw new Error(`Model did not call the ${toolName} tool`);
  }
  return block.input as T;
}

export async function pickIdea(recentTitles: string[]): Promise<Idea> {
  if (config.dryRun) return readExampleIdea();

  const msg = await client().messages.create({
    model: config.ideaModel,
    max_tokens: 1024,
    tool_choice: {type: 'tool', name: 'emit_idea'},
    tools: [
      {
        name: 'emit_idea',
        description: 'Return a single portfolio project idea.',
        input_schema: {
          type: 'object',
          properties: {
            slug: {type: 'string', description: 'kebab-case, <=30 chars, url-safe'},
            title: {type: 'string', description: 'Punchy display title, <=45 chars'},
            description: {type: 'string', description: 'One sentence, <=140 chars, what it does + why it is neat'},
          },
          required: ['slug', 'title', 'description'],
        },
      },
    ],
    messages: [
      {
        role: 'user',
        content:
          `Invent ONE small but genuinely impressive personal project for the portfolio of Didrik Liu, ` +
          `a Data Analyst & AI Engineer. It must be buildable as a single-page, fully static web app ` +
          `(HTML/CSS/vanilla JS only — no backend, no build step, no external network calls). ` +
          `Favour interactive data/AI-flavoured toys: visualizations, algorithm demos, generative art, ` +
          `simulations. Avoid anything requiring API keys or servers.\n\n` +
          `Do NOT repeat any of these existing projects:\n${recentTitles.map(t => `- ${t}`).join('\n') || '(none yet)'}`,
      },
    ],
  });

  return forceTool<Idea>(msg.content, 'emit_idea');
}

export async function generateApp(idea: Idea): Promise<GeneratedFile[]> {
  if (config.dryRun) return readExampleFiles();

  const msg = await client().messages.create({
    model: config.model,
    max_tokens: 16000,
    tool_choice: {type: 'tool', name: 'emit_app'},
    tools: [
      {
        name: 'emit_app',
        description: 'Return the complete set of files for the static web app.',
        input_schema: {
          type: 'object',
          properties: {
            files: {
              type: 'array',
              description: 'Every file the app needs. Must include index.html at the root.',
              items: {
                type: 'object',
                properties: {
                  path: {type: 'string', description: 'Relative path, e.g. index.html or js/app.js'},
                  content: {type: 'string'},
                },
                required: ['path', 'content'],
              },
            },
          },
          required: ['files'],
        },
      },
    ],
    messages: [
      {
        role: 'user',
        content:
          `Build "${idea.title}": ${idea.description}\n\n` +
          `Requirements:\n` +
          `- A single-page static web app. index.html at the root, plus any css/js/asset files.\n` +
          `- Vanilla HTML/CSS/JS ONLY. No frameworks, no bundler, no npm, no CDN <script>/<link> to external hosts, no fetch to external APIs. Everything must work fully offline from file://.\n` +
          `- Polished, responsive, works on mobile. Include a short title + one-line explanation on the page.\n` +
          `- Self-contained and safe: no eval of remote code, no user secrets.\n` +
          `- Aim for a tasteful, minimal aesthetic. It will be screenshotted for a portfolio.\n` +
          `Return the files via the emit_app tool.`,
      },
    ],
  });

  const {files} = forceTool<{files: GeneratedFile[]}>(msg.content, 'emit_app');
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
