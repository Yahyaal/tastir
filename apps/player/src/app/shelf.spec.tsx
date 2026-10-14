import { act, fireEvent, render, screen, within } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import App from './app';
import { addDesign, listDesigns, type DesignFields } from './designs';
import { entriesOf } from './library';
import { inkPiecesOf, loadModel } from './model';
import { classicSelection } from '@tastir/engine';

const entries = entriesOf({
  '../../../../tutorials/eight-fold-star-and-cross.json': example,
});

const design = (name: string, more: Partial<DesignFields> = {}) =>
  addDesign({
    name,
    tutorial: 'eight-fold-star-and-cross',
    coloring: { palette: 'Chefchaouen', chosen: {} },
    look: 'tiles',
    grout: 1,
    ...more,
  });

const shelf = () =>
  screen.getByRole('region', { name: 'My designs' }) as HTMLElement;
/** How many pieces a card's wall draws (one M per piece). */
const piecesDrawn = (name: string) =>
  [
    ...(
      within(shelf())
        .getByRole('heading', { name })
        .closest('li') as HTMLElement
    ).querySelectorAll('.thumbnail path.piece'),
  ]
    .map((p) => p.getAttribute('d') ?? '')
    .join('')
    .split('M').length - 1;

afterEach(() => {
  window.location.hash = '';
});

describe('the shelf of my designs', () => {
  // Designs are managed on #/work; the home page shows one row of them.
  beforeEach(() => {
    window.location.hash = '#/work';
  });

  it('is not shown until there is a design', () => {
    render(<App entries={entries} />);
    expect(screen.queryByRole('region', { name: 'My designs' })).toBeNull();
  });

  it('lists saved designs, each drawn as its wall, and opens one', () => {
    const a = design('Blue one');
    design('Strapwork', { look: 'strapwork' });
    render(<App entries={entries} />);
    const cards = within(shelf()).getAllByRole('heading', { level: 4 });
    expect(cards.map((h) => h.textContent)).toEqual(['Strapwork', 'Blue one']);
    // Drawn in the design's own colors, not the tutorial's.
    const fills = [...shelf().querySelectorAll('.thumbnail path.piece')].map(
      (p) => p.getAttribute('fill'),
    );
    expect(fills).toContain('#2d5fa8');
    expect(fills).not.toContain('#1d5c7c');
    expect(shelf().querySelectorAll('.thumbnail path.piece.strap').length).toBe(
      fills.length / 2,
    );
    const link = within(shelf()).getByRole('link', { name: /Blue one/ });
    expect(link.getAttribute('href')).toBe(
      `#/eight-fold-star-and-cross/design/${a?.id}`,
    );
    act(() => {
      window.location.hash = link.getAttribute('href') ?? '';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(document.querySelector('.label')?.textContent).toBe('Color');
    expect(screen.getByText('Blue one', { selector: 'b' })).toBeTruthy();
  });

  it('draws a design with its own inking', () => {
    // The star and cross with one bit of line erased: the star and the
    // cross beside it merge, so the wall has fewer pieces.
    const model = loadModel(example);
    const classic = classicSelection(
      inkPiecesOf(model),
      model.pattern.ink,
      model.scene.tol.eps,
      model.pattern.cell,
    );
    design('Classic');
    design('Erased', { inked: [...classic].slice(1) });
    render(<App entries={entries} />);
    expect(piecesDrawn('Erased')).toBeGreaterThan(0);
    expect(piecesDrawn('Erased')).toBeLessThan(piecesDrawn('Classic'));
  });

  it('renames a design in place', () => {
    design('Old name');
    render(<App entries={entries} />);
    fireEvent.click(within(shelf()).getByRole('button', { name: 'Rename' }));
    fireEvent.change(within(shelf()).getByLabelText(/New name/), {
      target: { value: 'New name' },
    });
    fireEvent.click(within(shelf()).getByRole('button', { name: 'Rename' }));
    expect(listDesigns()[0]?.name).toBe('New name');
    expect(
      within(shelf()).getByRole('heading', { name: 'New name' }),
    ).toBeTruthy();
  });

  it('deletes a design only after asking', () => {
    design('Keep me');
    design('Bin me');
    render(<App entries={entries} />);
    const card = within(shelf())
      .getByRole('heading', { name: 'Bin me' })
      .closest('li') as HTMLElement;
    fireEvent.click(within(card).getByRole('button', { name: 'Delete' }));
    // Asked first, in the page; keeping it changes nothing.
    expect(within(card).getByText(/Delete “Bin me”\?/)).toBeTruthy();
    expect(listDesigns()).toHaveLength(2);
    fireEvent.click(within(card).getByRole('button', { name: 'Keep it' }));
    expect(listDesigns()).toHaveLength(2);
    fireEvent.click(within(card).getByRole('button', { name: 'Delete' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Delete' }));
    expect(listDesigns().map((d) => d.name)).toEqual(['Keep me']);
    expect(
      within(shelf()).queryByRole('heading', { name: 'Bin me' }),
    ).toBeNull();
    // The last one gone, the shelf goes too.
    const last = within(shelf())
      .getByRole('heading', { name: 'Keep me' })
      .closest('li') as HTMLElement;
    fireEvent.click(within(last).getByRole('button', { name: 'Delete' }));
    fireEvent.click(within(last).getByRole('button', { name: 'Delete' }));
    expect(screen.queryByRole('region', { name: 'My designs' })).toBeNull();
  });

  it('closes the rename box on Escape, and keeps names short', () => {
    design('Short');
    render(<App entries={entries} />);
    fireEvent.click(within(shelf()).getByRole('button', { name: 'Rename' }));
    const box = within(shelf()).getByLabelText(/New name/);
    expect(box.getAttribute('maxLength')).toBe('60');
    fireEvent.keyDown(box, { key: 'Escape' });
    expect(within(shelf()).queryByLabelText(/New name/)).toBeNull();
    // The store cuts a name to 60 characters whatever sends it.
    expect(design('x'.repeat(300))?.name).toHaveLength(60);
  });

  it('shows one row of them on the home page, and links to the rest', () => {
    window.location.hash = '';
    for (const n of ['One', 'Two', 'Three', 'Four', 'Five']) design(n);
    render(<App entries={entries} />);
    expect(
      screen.getByRole('link', { name: 'Your work (5)' }).getAttribute('href'),
    ).toBe('#/work');
    const yours = screen.getByRole('region', { name: 'Your work' });
    // The four latest, without rename or delete (those are on #/work).
    expect(
      within(yours)
        .getAllByRole('heading', { level: 4 })
        .map((h) => h.textContent),
    ).toEqual(['Five', 'Four', 'Three', 'Two']);
    expect(within(yours).queryByRole('button', { name: 'Rename' })).toBeNull();
    expect(
      within(yours).getByRole('link', { name: /See all \(5\)/ }),
    ).toHaveProperty('hash', '#/work');
  });

  it('says what goes on #/work while there is nothing yet', () => {
    render(<App entries={entries} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Your work' }),
    ).toBeTruthy();
    expect(screen.getByText(/Nothing here yet/)).toBeTruthy();
  });

  it('puts Your work after the welcome when nothing is in progress', () => {
    window.location.hash = '';
    design('One');
    render(<App entries={entries} />);
    const yours = screen.getByRole('region', { name: 'Your work' });
    const hero = document.querySelector('.hero') as HTMLElement;
    expect(
      hero.compareDocumentPosition(yours) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // A row of cards, without tabs.
    expect(within(yours).queryByRole('group', { name: 'Show' })).toBeNull();
  });

  it('keeps an unreadable store aside before writing, and says so', () => {
    window.localStorage.setItem('tastir.designs', '{"from": "the future"}');
    design('New');
    expect(window.localStorage.getItem('tastir.designs.unreadable')).toBe(
      '{"from": "the future"}',
    );
    render(<App entries={entries} />);
    expect(
      within(shelf()).getByText(/Some saved designs could not be read/),
    ).toBeTruthy();
  });

  it('keeps a design whose tutorial is gone, so it can be deleted', () => {
    design('Lost', { tutorial: 'no-such-pattern' });
    render(<App entries={entries} />);
    expect(within(shelf()).getByText(/no longer in the library/)).toBeTruthy();
    expect(
      within(shelf()).getByRole('button', { name: 'Delete' }),
    ).toBeTruthy();
  });
});
