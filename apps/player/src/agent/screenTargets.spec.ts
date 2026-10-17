import { controls, pointingRevision, paintedElement } from './screenTargets';
import { pageRevision } from './navigation';

beforeEach(() => {
  document.body.innerHTML =
    '<main data-tastir-page><button aria-label="Next step">→</button><button hidden>Secret</button><input type="password" value="secret" /></main><aside><button>Disconnect private account</button></aside>';
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 10,
    y: 20,
    left: 10,
    top: 20,
    right: 110,
    bottom: 64,
    width: 100,
    height: 44,
    toJSON: () => ({}),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

it('offers only labeled visible controls in the real page, without form or account values', () => {
  const list = controls();
  expect(list).toHaveLength(1);
  expect(list[0]!.target).toMatchObject({
    kind: 'control',
    geometry: { label: 'Next step', role: 'button', enabled: true },
  });
  expect(JSON.stringify(list.map((t) => t.target))).not.toMatch(
    /secret|private|Disconnect/,
  );
  expect(controls()[0]!.target.id).toBe(list[0]!.target.id);
});
it('invalidates observations for enabled state and replaced controls, and excludes controls behind a modal', () => {
  const first = JSON.stringify(pointingRevision(undefined));
  document.querySelector('main button')!.setAttribute('disabled', '');
  expect(JSON.stringify(pointingRevision(undefined))).not.toBe(first);
  const id = controls()[0]!.target.id;
  document.querySelector('main')!.innerHTML =
    '<button aria-label="Next step">→</button>';
  expect(controls()[0]!.target.id).not.toBe(id);
  document
    .querySelector('main')!
    .insertAdjacentHTML(
      'beforeend',
      '<div role="dialog"><button>Stay here</button></div>',
    );
  expect(controls().map((c) => c.target.geometry.label)).toEqual(['Stay here']);
});

it('keeps navigation valid when identical controls are remounted while invalidating their old pointing IDs', () => {
  const content = pageRevision(false);
  const view = pageRevision();
  const button = document.querySelector('main button')!;
  button.replaceWith(button.cloneNode(true));
  expect(pageRevision(false)).toBe(content);
  expect(pageRevision()).not.toBe(view);
});

it('excludes fully faded SVG geometry without rejecting horizontal strokes by their bounding box', () => {
  document
    .querySelector('main')!
    .insertAdjacentHTML(
      'beforeend',
      '<svg><g style="opacity:0"><line id="faded" x1="0" y1="0" x2="1" y2="0" /></g><line id="shown" x1="0" y1="0" x2="1" y2="0" /></svg>',
    );
  expect(paintedElement(document.getElementById('faded')!)).toBe(false);
  expect(paintedElement(document.getElementById('shown')!)).toBe(true);
});
