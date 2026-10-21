import { test, expect } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { blueSquare } from './blue-square.mjs';

// The studio card in a stand-in chat app (card-host.mts beside this file),
// which shows it through the MCP Apps host bridge, as claude.ai does.
const port = 4398;
const site = `http://127.0.0.1:${port}`;
let host: ChildProcess;

test.beforeAll(async () => {
  host = spawn(
    'node',
    [
      '--conditions=@tastir/source',
      '--import',
      'tsx',
      'apps/studio/e2e/card-host.mts',
      String(port),
    ],
    {
      cwd: join(import.meta.dirname, '../../..'),
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );
  await new Promise<void>((resolve, reject) => {
    host.stdout!.on('data', (d: Buffer) => {
      if (String(d).includes('Stand-in chat')) resolve();
    });
    host.on('exit', () => reject(new Error('The stand-in chat stopped.')));
  });
});
test.afterAll(() => {
  host.kill();
});

async function agent(method: 'GET' | 'POST', path: string, data?: unknown) {
  const response = await fetch(`${site}/__test/agent`, {
    method: 'POST',
    body: JSON.stringify({ method, path, data }),
  });
  return (await response.json()) as any;
}

test('the card shows the live drawing and takes the owner’s answer', async ({
  page,
}) => {
  const made = await agent('POST', '/projects', {
    author: 'claude',
    title: 'In the chat',
  });
  const id = made.project as string;
  await page.goto(`${site}/?project=${id}`);
  const card = page.frameLocator('iframe[title="Studio card"]');
  await expect(
    card.getByRole('heading', { name: 'In the chat' }),
  ).toBeVisible();
  await expect(card.getByText('Revision 1')).toBeVisible();

  // The agent draws and asks; the card follows.
  await agent('POST', `/projects/${id}/edit`, {
    author: 'claude',
    revision: 1,
    edit: {
      op: 'construct',
      add: [{ kind: 'circle', name: 'C0', centre: 'O', through: 'A' }],
    },
  });
  await expect(
    card.getByText(/Revision 2\. Last: claude, Added C0/),
  ).toBeVisible({
    timeout: 8000,
  });
  await expect(
    card.getByRole('img', { name: 'The drawing at revision 2' }),
  ).toBeVisible();
  const asked = await agent('POST', `/projects/${id}/questions`, {
    author: 'claude',
    text: 'Keep this circle?',
  });
  await expect(card.getByText('claude: Keep this circle?')).toBeVisible({
    timeout: 8000,
  });
  await card.getByLabel('Your answer to claude').fill('Yes, keep it.');
  await card.getByRole('button', { name: 'Answer' }).click();
  await expect(card.getByText('Answer sent.')).toBeVisible();
  const notes = (await agent('GET', `/projects/${id}/notes`)).notes as any[];
  expect(notes.at(-1)).toMatchObject({
    author: 'owner',
    text: 'Yes, keep it.',
    answers: asked.question.id,
  });
});

test('the card opens a finished project at its colored repeating wall', async ({
  page,
}) => {
  const id = await blueSquare(agent, 'Finished in the chat');
  await page.goto(`${site}/?project=${id}`);
  const card = page.frameLocator('iframe[title="Studio card"]');
  await expect(
    card.getByRole('heading', { name: 'Finished in the chat' }),
  ).toBeVisible();
  await expect(
    card.getByRole('img', { name: 'The colored repeating wall at revision 5' }),
  ).toBeVisible();
  await expect(
    card.getByText('Finished wall · repeating tiles and colors'),
  ).toBeVisible();
});
