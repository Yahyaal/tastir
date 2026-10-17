import { App } from '@modelcontextprotocol/ext-apps';

/**
 * The studio card inside a chat (MCP Apps, task H8): the live drawing of
 * one project, who changed it last, and the agent's open questions, which
 * the owner answers here. It talks to the studio only through the two
 * tools only a card may call, studio_snapshot and answer_question, and
 * asks again every three seconds while it is on screen.
 */
interface Snapshot {
  project: string;
  title: string;
  revision: number;
  last: { author: string; label: string } | null;
  questions: { id: number; author: string; text: string; about?: string }[];
  picture?: string;
}

const app = new App({ name: 'Tastir studio card', version: '1.0.0' });
const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
let project: string | undefined;
let revision = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

function say(text: string) {
  $('status').textContent = text;
}

function show(s: Snapshot) {
  $('title').textContent = s.title;
  $('meta').textContent = `Revision ${s.revision}${
    s.last ? `. Last: ${s.last.author}, ${s.last.label}` : ''
  }`;
  if (s.picture) {
    const img = $<HTMLImageElement>('picture');
    img.src = `data:image/png;base64,${s.picture}`;
    img.alt = `The drawing at revision ${s.revision}`;
    img.hidden = false;
  }
  revision = s.revision;
  const list = $('questions');
  const open = new Set(s.questions.map((q) => String(q.id)));
  for (const form of [...list.children])
    if (!open.has((form as HTMLElement).dataset['id'] ?? '')) form.remove();
  for (const q of s.questions) {
    if (list.querySelector(`[data-id="${q.id}"]`)) continue;
    const form = document.createElement('form');
    form.dataset['id'] = String(q.id);
    const p = document.createElement('p');
    p.textContent = `${q.author}${q.about ? ` (about ${q.about})` : ''}: ${q.text}`;
    const label = document.createElement('label');
    label.textContent = `Your answer to ${q.author}`;
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 4000;
    label.append(input);
    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'Answer';
    form.append(p, label, button);
    form.onsubmit = (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || !project) return;
      button.disabled = true;
      app
        .callServerTool({
          name: 'answer_question',
          arguments: { project, question: q.id, text },
        })
        .then((r) => {
          if (r.isError) throw new Error(textOf(r));
          form.remove();
          say('Answer sent.');
        })
        .catch((err: Error) => {
          button.disabled = false;
          say(err.message);
        });
    };
    list.append(form);
  }
  $('questions-heading').hidden = s.questions.length === 0;
}

const textOf = (r: { content?: { type: string; text?: string }[] }) =>
  r.content?.find((c) => c.type === 'text')?.text ??
  'The studio did not answer.';

async function look() {
  timer = undefined;
  if (!project) return;
  if (!document.hidden)
    try {
      const r = await app.callServerTool({
        name: 'studio_snapshot',
        arguments: { project, revision },
      });
      if (r.isError) throw new Error(textOf(r));
      show(r.structuredContent as unknown as Snapshot);
      say('');
    } catch (e) {
      say((e as Error).message);
    }
  timer = setTimeout(() => void look(), 3000);
}

function start(args: Record<string, unknown> | undefined) {
  const next =
    typeof args?.['project'] === 'string' ? args['project'] : undefined;
  if (!next || next === project) return;
  project = next;
  revision = 0;
  clearTimeout(timer);
  void look();
}

app.ontoolinput = (params) => start(params.arguments);
app.ontoolresult = (params) =>
  start(params.structuredContent as Record<string, unknown> | undefined);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !timer) void look();
});
void app.connect().then(() => {
  const theme = app.getHostContext()?.theme;
  if (theme) document.documentElement.dataset['theme'] = theme;
});
