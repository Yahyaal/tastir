import './review.css';
import './plan.css';

/**
 * The plan for drawing along (#/plan/draw-along): the learner builds the
 * pattern on the left while the tutorial shows each step on the right.
 * Its pictures are mock-ups made from screenshots of the app, kept in
 * docs/review (dev server only), and its questions are on the review page.
 */

const pic = (file: string) =>
  `/__review/renders/user-patterns/draw-along/${file}`;

const BEGINNER = [
  'Eight-fold star and cross',
  'Six-fold star and hexagons',
  'Six-fold snowflake',
  'Twelve-fold dodecagrams',
  'Samira Mian’s twelve-fold rosette (square and hexagonal tiles)',
  'Seven Alhambra panels: the Arrayanes squares, the Comares bones and dado, the Infantas crosses and stars, and the star and arrows (two ways)',
];

const TASKS: readonly { name: string; does: string; done: string }[] = [
  {
    name: '6.1 Checking a step',
    does: 'An engine function compares the learner’s drawing with one step of the tutorial by where things are, not by their names, and lists what is still missing.',
    done: 'Every beginner tutorial’s own steps pass, and a step drawn a different way that lands in the same place passes too.',
  },
  {
    name: '6.2 The split screen',
    does: '“Draw along” opens the learner’s board on the left and the tutorial’s step on the right. Next opens once the step is on the board. On a phone a button swaps the two halves.',
    done: 'The first three steps of the star and cross drawn by clicking, with Next opening after each.',
  },
  {
    name: '6.3 Hints',
    does: '“Show me a hint” goes one level further each time: what the step works from glows, then where to click is ringed, then the answer is dashed. “Draw it for me” draws it.',
    done: 'Each level shown on a step of the star and cross, and Draw it for me moving on.',
  },
  {
    name: '6.4 Ink, wall and colour',
    does: 'After the last step the learner inks their own board; when its pieces match the pattern’s, the player repeats it into a wall and they colour it. Their drawing is kept as one of their patterns.',
    done: 'The star and cross finished by hand, ending on the coloured wall.',
  },
  {
    name: '6.5 Way in and progress',
    does: 'A “Draw along” button on every beginner card and in the player. A learner who leaves comes back to the step they were on.',
    done: 'Leave at step 4, come back, and the board and the step are as they were.',
  },
  {
    name: '6.6 Every beginner pattern',
    does: 'A test runs Draw it for me through every beginner tutorial and checks the pieces; the tester agent draws three of them by hand, as a learner.',
    done: 'All thirteen pass, and the tester’s report has no blocking problem.',
  },
];

export function DrawAlongPlan() {
  return (
    <div className="review plan">
      <nav className="review-top">
        <a href="#/">← Library</a>
        <span>
          <a href="#/review">Review page</a> · <a href="#/plan">First plan</a>
        </span>
      </nav>
      <header className="review-head">
        <h1>Plan: draw along</h1>
        <p className="lede">
          Your idea: the tutorial shows each step on the right, and the learner
          draws the same step on the left with the editor’s tools. Learners stop
          watching and start drawing, which is where they learn. This page is my
          plan; my three questions about it are at the top of the{' '}
          <a href="#/review">review page</a>.
        </p>
      </header>

      <h2 className="group">What the learner sees</h2>
      <figure className="plan-fig">
        <img
          className="plan-shot"
          src={pic('a-split-screen.png')}
          alt="The split screen: the learner's board on the left, the tutorial's step on the right"
        />
        <figcaption>
          A mock-up made from the real editor and player. A is the learner’s
          board, with the editor’s tools; B is the step to copy, exactly as the
          player shows it; C are the hint buttons, and Next opens once the board
          has the step.
        </figcaption>
      </figure>
      <p>
        The right half is the player as it is today, without its own Next: it
        moves on when the learner does. The left half is the editor, so the
        learner already has every tool, Undo, zoom and the symmetry switch.
        Points never need drawing, because crossings appear by themselves on the
        board as they do on paper.
      </p>

      <h2 className="group">How the app knows a step is done</h2>
      <p>
        The app compares the board with the step by where things are, not by how
        they were made. A diagonal drawn with Halve angle and one ruled through
        two opposite points are the same line, so both count. This matters
        because a learner who finds another way is right, and telling them
        otherwise would teach the wrong thing. A step with many copies, such as
        eight circles round a ring, counts as done when all of them are there,
        drawn one by one or with the symmetry switch, and the step text shows
        how many are still missing. Anything the learner draws that the step
        does not need stays on the board in faint grey and never counts against
        them.
      </p>
      <figure className="plan-fig">
        <img
          className="plan-shot narrow"
          src={pic('c-step-done.png')}
          alt="The board with both diagonals drawn and a tick saying the step is done"
        />
        <figcaption>
          When the step is on the board, the app says so and Next opens.
        </figcaption>
      </figure>

      <h2 className="group">Hints that grow</h2>
      <p>
        A learner who is stuck presses “Show me a hint”, and each press shows a
        little more. First the lines and circles the step works from glow on
        their board, which is often enough. Then the points to click are ringed.
        Then the answer is drawn dashed for them to draw over. “Draw it for me”
        is always there for someone who just wants to move on.
      </p>
      <figure className="plan-fig">
        <img
          className="plan-shot"
          src={pic('b-hints.png')}
          alt="Three hint levels on the board: glowing lines, ringed points, the dashed answer"
        />
        <figcaption>
          The three hint levels for step 3 of the star and cross.
        </figcaption>
      </figure>

      <h2 className="group">The end: ink, wall and colour</h2>
      <p>
        After the last step the learner inks their own board by clicking bits of
        line, as in the editor. When the pieces their ink closes match the
        pattern’s, the player takes over with their drawing: it repeats the tile
        into a wall and they colour it. The finished drawing is kept as one of
        their own patterns, so they can play it, change it or start a new design
        from it.
      </p>

      <h2 className="group">Beginner patterns first</h2>
      <p>
        There are thirteen beginner tutorials, and every one uses only circles
        about a point, ruled lines, polygons and copies round the centre, all of
        which the editor already draws:
      </p>
      <ul>
        {BEGINNER.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <h2 className="group">The work, in order</h2>
      <p>
        The same two agents build it as before, a builder and a tester who draws
        along as a learner, with each task committed and recorded in the build
        log so a usage limit loses nothing.
      </p>
      <ol className="plan-phases">
        {TASKS.map((t) => (
          <li key={t.name}>
            <h3>{t.name}</h3>
            <p>{t.does}</p>
            <p className="plan-done">
              <b>Done when:</b> {t.done}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
