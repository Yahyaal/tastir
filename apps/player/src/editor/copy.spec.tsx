import { act, fireEvent, render, screen } from '@testing-library/react';
import example from '@tutorials/eight-fold-star-and-cross.json';
import App, { Play } from '../app/app';
import { listPatterns } from './patterns';

const click = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }));

afterEach(() => {
  window.location.hash = '';
});

describe('make my own copy from here', () => {
  it('copies the star and cross at step 3, and the editor opens with three steps', () => {
    render(<Play json={example} />);
    fireEvent.click(screen.getByLabelText('Reduce motion'));
    click('Next');
    click('Next');
    expect(document.querySelector('.label')?.textContent).toBe('Step 3 of 6');
    click('Make my own copy from here');
    const [mine] = listPatterns();
    expect(mine?.tutorial.steps.map((s) => s.id)).toEqual([1, 2, 3]);
    expect(mine?.basedOn).toEqual({
      tutorial: 'eight-fold-star-and-cross',
      title: 'Eight-fold star and cross',
      step: 3,
    });
    // The original stays named, in the credits that travel with the file.
    expect(mine?.tutorial.credits.at(-1)?.note).toMatch(
      /Copied from the library tutorial “Eight-fold star and cross”/,
    );
    expect(mine?.tutorial.ink).toBeUndefined();
    expect(window.location.hash).toBe(`#/edit/${mine?.id}`);

    render(<App />);
    expect(document.querySelectorAll('.editor-step')).toHaveLength(3);
    expect(screen.getByText(/Based on/).textContent).toMatch(
      /Eight-fold star and cross, up to step 3/,
    );
    expect(document.querySelectorAll('.editor-step.broken')).toHaveLength(0);
  });

  it('says so when the browser will not keep the copy', () => {
    render(<Play json={example} />);
    const set = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('full');
      });
    act(() => click('Make my own copy from here'));
    set.mockRestore();
    expect(screen.getByRole('alert').textContent).toMatch(
      /would not keep the copy/,
    );
    expect(listPatterns()).toEqual([]);
  });
});
