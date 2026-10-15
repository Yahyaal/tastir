import { SnapshotShape } from '@tastir/agent-protocol';
import { parseTutorial } from '@tastir/schema';
import source from '@tutorials/eight-fold-star-and-octagon.json';
import { addPattern, deletePattern } from '../editor/patterns';
import { addDesign } from '../app/designs';
import { tutorialColoring } from '../app/coloring';
import { loadModel } from '../app/model';
import {
  destinationsOf,
  navigateTo,
  observeScreen,
  pageRevision,
  screenInfo,
} from './navigation';

const tutorial = parseTutorial(source);
const library = [{ id: tutorial.id, json: tutorial }];
beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
  window.history.replaceState(null, '', '#/');
});
afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
});

describe('assistant navigation', () => {
  it('lists only real routes and saved records, including finished patterns and designs', () => {
    const unfinished = addPattern({
      ...tutorial,
      pattern: undefined,
      ink: undefined,
    })!;
    const finished = addPattern(tutorial)!;
    const design = addDesign({
      name: 'My last blue wall',
      tutorial: tutorial.id,
      coloring: tutorialColoring(loadModel(tutorial)),
      look: 'tiles',
      grout: 1,
    })!;
    const list = destinationsOf([
      ...library,
      { id: 'https://example.com', json: {} },
    ]);
    expect(list.some((d) => d.id === `editor:${unfinished.id}`)).toBe(true);
    expect(list.some((d) => d.route === `mine/${unfinished.id}`)).toBe(false);
    expect(list.some((d) => d.route === `mine/${finished.id}`)).toBe(true);
    expect(list.find((d) => d.id === `design:${design.id}`)?.title).toContain(
      'My last blue wall',
    );
    expect(list.some((d) => d.route.includes('https:'))).toBe(false);
    expect(new Set(list.map((d) => d.id)).size).toBe(list.length);
  });
  it('rejects invented or deleted destinations before changing the address', async () => {
    const pattern = addPattern(tutorial)!;
    const screen = {
      route: '',
      title: 'Library',
      description: '',
      destinations: destinationsOf(library),
    };
    const observation = SnapshotShape.parse({
      id: 'view',
      documentId: 'screen:library',
      documentRevision: '1',
      viewRevision: '1',
      title: 'Library',
      selected: null,
      targets: [],
      mode: 'screen',
      screen,
      image: null,
    });
    const signal = new AbortController().signal;
    await expect(
      navigateTo(
        'https://example.com',
        observation,
        screen.destinations,
        signal,
      ),
    ).rejects.toThrow('not available');
    deletePattern(pattern.id);
    await expect(
      navigateTo(
        `editor:${pattern.id}`,
        observation,
        destinationsOf(library),
        signal,
      ),
    ).rejects.toThrow('not available');
    expect(window.location.hash).toBe('#/');
  });
  it('observes a saved-design address changed in place by the player', async () => {
    document.body.innerHTML =
      '<div data-tastir-page data-tastir-route="example/result"><div data-tastir-screen="example/design/saved"><h1>My wall</h1></div></div>';
    window.history.replaceState(null, '', '#/example/design/saved');
    const observation = await observeScreen(destinationsOf(library));
    expect(observation.screen?.route).toBe('example/design/saved');
    expect(observation.title).toBe('My wall');
    expect(observation.image).toBeNull();
  });
  it('registers committed page context and invalidates it after controls or routes change', () => {
    document.body.innerHTML =
      '<div data-tastir-page data-tastir-route=""><h1>Library</h1><input value="before" /></div>';
    const revision = pageRevision();
    const input = document.querySelector('input')!;
    input.value = 'after';
    expect(pageRevision()).not.toBe(revision);
    expect(screenInfo(destinationsOf(library)).title).toBe('Library');
    const next = pageRevision();
    window.history.replaceState(null, '', '#/work');
    expect(pageRevision()).not.toBe(next);
  });
});
