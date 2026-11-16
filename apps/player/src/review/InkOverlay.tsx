import { useEffect, useRef, useState } from 'react';
import { LIBRARY } from '../app/library';
import type { InkComparison, Stroke } from './inkComparison';
import type { OverlayReply } from './inkComparison.worker';

const options = LIBRARY.filter((e) => !e.of);
const initialA =
  options.find((e) => e.id === 'paccard-222-rosette')?.id ??
  options[0]?.id ??
  '';
const initialB =
  options.find((e) => e.id === 'paccard-222-rosette-ring')?.id ??
  options[0]?.id ??
  '';
const percent = (n: number) =>
  n < 1 && n >= 0.99995 ? '>99.99%' : `${(n * 100).toFixed(2)}%`;
function Drawing({ result }: { result: InkComparison }) {
  const points = result.boundary;
  if (!points.length) return null;
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  const left = Math.min(...xs),
    bottom = Math.min(...ys),
    width = Math.max(...xs) - left,
    height = Math.max(...ys) - bottom;
  const margin = Math.max(width, height) * 0.06;
  const lines = (strokes: Stroke[], kind: string) =>
    strokes.map((s, i) => (
      <line
        key={`${kind}-${i}`}
        x1={s.a.x}
        y1={-s.a.y}
        x2={s.b.x}
        y2={-s.b.y}
        className={`ink-${kind}`}
      />
    ));
  return (
    <svg
      className="ink-overlay-drawing"
      viewBox={`${left - margin} ${-bottom - height - margin} ${width + margin * 2} ${height + margin * 2}`}
      role="img"
      aria-label="Aligned ink: grey is shared, blue is only in A, orange is only in B"
    >
      <polygon
        points={points.map((p) => `${p.x},${-p.y}`).join(' ')}
        className="ink-boundary"
      />
      {lines(result.shared, 'shared')}
      {lines(result.onlyA, 'a')}
      {lines(result.onlyB, 'b')}
    </svg>
  );
}

export function InkOverlay() {
  const [a, setA] = useState(initialA),
    [b, setB] = useState(initialB);
  const [result, setResult] = useState<InkComparison>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const worker = useRef<Worker | null>(null);
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
      worker.current?.terminate();
    },
    [],
  );
  function cancel() {
    generation.current++;
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
  }
  function select(side: 'a' | 'b', id: string) {
    cancel();
    setResult(undefined);
    setError('');
    if (side === 'a') setA(id);
    else setB(id);
  }
  async function compare() {
    cancel();
    const current = generation.current;
    setResult(undefined);
    setError('');
    setBusy(true);
    try {
      const load = async (id: string) => {
        const entry = options.find((e) => e.id === id);
        if (!entry) throw new Error('Choose a tutorial for each pattern.');
        return typeof entry.json === 'function'
          ? await entry.json()
          : entry.json;
      };
      const [jsonA, jsonB] = await Promise.all([load(a), load(b)]);
      if (current !== generation.current) return;
      const job = new Worker(
        new URL('./inkComparison.worker.ts', import.meta.url),
        { type: 'module' },
      );
      worker.current = job;
      job.onmessage = ({ data }: MessageEvent<OverlayReply>) => {
        if (current !== generation.current) return;
        if ('error' in data) setError(data.error);
        else setResult(data.result);
        setBusy(false);
        job.terminate();
        worker.current = null;
      };
      job.onerror = () => {
        if (current !== generation.current) return;
        setError('The comparison worker failed. Please try again.');
        setBusy(false);
        job.terminate();
        worker.current = null;
      };
      job.postMessage({ a: jsonA, b: jsonB });
    } catch (e) {
      if (current === generation.current) {
        setError(e instanceof Error ? e.message : String(e));
        setBusy(false);
      }
    }
  }
  return (
    <section className="ink-overlay" aria-labelledby="ink-overlay-heading">
      <h2 id="ink-overlay-heading">Compare the ink</h2>
      <p>
        Choose any two tutorials. The overlay compares their repeated lines,
        allowing a turn, a shift, uniform scale and, separately, a mirror.
      </p>
      <div className="ink-overlay-controls">
        {(['a', 'b'] as const).map((side) => (
          <label key={side}>
            Pattern {side.toUpperCase()}
            <select
              aria-label={`Pattern ${side.toUpperCase()}`}
              value={side === 'a' ? a : b}
              onChange={(e) => select(side, e.target.value)}
            >
              {options.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.preview?.title ?? entry.id}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button
          type="button"
          onClick={() => void compare()}
          disabled={busy || !a || !b}
        >
          Compare ink
        </button>
        {busy && (
          <button type="button" onClick={cancel}>
            Cancel
          </button>
        )}
      </div>
      <p>
        <a href={`#/${a}/result`} target="_blank" rel="noreferrer">
          Open A ↗
        </a>
        {' · '}
        <a href={`#/${b}/result`} target="_blank" rel="noreferrer">
          Open B ↗
        </a>
      </p>
      <div role="status" aria-live="polite">
        {busy ? 'Finding repeats and aligning ink…' : error}
      </div>
      {result && (
        <>
          <h3>
            {result.status === 'same'
              ? 'The same lines'
              : result.status === 'different'
                ? 'Different lines'
                : 'Alignment inconclusive'}
          </h3>
          <p>{result.reason}</p>
          {result.placement && (
            <>
              <p>
                A covered by B: <b>{percent(result.coverageA)}</b>. B covered by
                A: <b>{percent(result.coverageB)}</b>.
              </p>
              <p>
                {result.placement.mirrored
                  ? 'Requires a mirror. '
                  : 'No mirror needed. '}
                A’s supplied tile holds {result.repeatA?.cells} minimal cell(s);
                B’s holds {result.repeatB?.cells}.
              </p>
              <p className="ink-legend">
                <span className="ink-shared">Shared ink</span>
                {' · '}
                <span className="ink-a">Only in A</span>
                {' · '}
                <span className="ink-b">Only in B</span>
              </p>
              <Drawing result={result} />
              <p className="dup-hint">
                Tolerance: {result.tolerance} in units where A’s supplied tile
                has area 1. Percentages measure line length. The verdict uses
                unrounded differences. This view shows one common repeat;
                mismatches use the best tested endpoint alignment.
              </p>
            </>
          )}
        </>
      )}
    </section>
  );
}
