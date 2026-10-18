import { render, screen } from '@testing-library/react';
import { inline } from './markdown';
import { DOCS, Notes } from './Notes';

describe('the project notes page', () => {
  it('shows the start page with a tab for every document', () => {
    render(<Notes />);
    expect(screen.getByRole('heading', { name: 'Start here' })).toBeTruthy();
    const tabs = [...document.querySelectorAll('.notes-tabs a')];
    expect(tabs.map((t) => t.textContent)).toEqual(DOCS.map((d) => d.label));
    expect(document.querySelector('.notes-tabs a.current')?.textContent).toBe(
      'Start here',
    );
  });

  it('names the next goal on the start page', () => {
    render(<Notes />);
    expect(screen.getByRole('heading', { name: 'The next goal' })).toBeTruthy();
  });

  it('opens other documents from their links, inside the app', () => {
    render(<Notes />);
    const queue = [...document.querySelectorAll('.notes-doc a')].find(
      (a) => a.textContent === 'the queue',
    );
    expect(queue?.getAttribute('href')).toBe('#/notes/queue');
  });

  it('shows the queue with its tasks ticked or open', () => {
    render(<Notes page="queue" />);
    expect(document.querySelectorAll('li.task.done').length).toBeGreaterThan(0);
    expect(
      document.querySelectorAll('li.task:not(.done)').length,
    ).toBeGreaterThan(0);
  });

  it('shows the hosted studio plan with its decisions and tasks to tick', () => {
    render(<Notes page="studio-hosted" />);
    expect(screen.getByRole('heading', { name: 'Tasks' })).toBeTruthy();
    expect(document.querySelectorAll('li.task').length).toBeGreaterThan(10);
  });

  it('shows the setup guide with its commands and clickable addresses', () => {
    render(<Notes page="studio-deploy" />);
    const doc = document.querySelector('.notes-doc')!;
    const commands = [...doc.querySelectorAll('pre code')].map(
      (c) => c.textContent,
    );
    expect(commands).toContain('git switch main\ngit pull\npnpm install');
    const neon = [...doc.querySelectorAll('a')].find(
      (a) => a.textContent === 'https://console.neon.tech/signup',
    );
    expect(neon?.getAttribute('href')).toBe('https://console.neon.tech/signup');
    // A numbered list split by a code block goes on from its number.
    expect(
      [...doc.querySelectorAll('ol')].some(
        (ol) => ol.getAttribute('start') === '2',
      ),
    ).toBe(true);
  });

  it('shows the status as a table', () => {
    render(<Notes page="status" />);
    expect(
      document.querySelectorAll('.notes-doc table').length,
    ).toBeGreaterThan(0);
  });

  it('never turns document text into HTML', () => {
    const { container } = render(
      <p>{inline('<b>x</b> **bold** `code`', (h) => h)}</p>,
    );
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('strong')?.textContent).toBe('bold');
    expect(container.textContent).toContain('<b>x</b>');
  });
});
