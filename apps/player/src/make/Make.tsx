import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { plasterFor, siliconeFor, stl, threeMf } from '@tastir/relief';
import { PieceShape } from '../app/drawing';
import { download } from '../app/exporting';
import { pieceName } from '../app/pieceNames';
import { useModel } from '../app/workerClient';
import { ReliefView } from './ReliefView';
import { MOULD_DRAFT, type Print } from './carve';
import { shapeOf, useCarved } from './reliefClient';
import {
  BED,
  carvingOf,
  extent,
  FLOOR,
  FRAME_OF,
  NARROWEST_BAND,
  outlineOf,
  PLA,
  PRINTS,
  printedHeight,
  printedOutline,
  SILICONE,
  rememberedSettings,
  rememberSettings,
  scaleOf,
  SHAPES,
  STYLES,
  styleOf,
  type MakeSettings,
  type Shape,
  type Style,
} from './settings';
import './make.css';

const mm = (n: number) => `${Math.round(n * 10) / 10} mm`;

/** A small cross-section of each carving: band, then the cut. */
function StyleIcon({ style }: { style: Style }) {
  const d = {
    facets: 'M1 5 H6 L14 15 L22 5 H27',
    flat: 'M1 5 H6 L7.5 15 H20.5 L22 5 H27',
    cushion: 'M1 5 H6 L7 15 Q14 6 21 15 L22 5 H27',
    raised: 'M1 5 H27',
  }[style];
  return (
    <svg className="style-icon" viewBox="0 0 28 18" aria-hidden="true">
      <path d={`${d} V17 H1 Z`} />
    </svg>
  );
}

function ShapeIcon({ shape }: { shape: Shape }) {
  return (
    <svg className="shape-icon" viewBox="0 0 24 24" aria-hidden="true">
      {shape === 'panel' ? <rect x="3" y="3" width="18" height="18" rx="1" /> : null}
      {shape === 'round' ? <circle cx="12" cy="12" r="9.5" /> : null}
      {shape === 'tile' ? <path d="M12 2.5 20.2 7.25V16.75L12 21.5 3.8 16.75V7.25Z" /> : null}
    </svg>
  );
}

/** A length with a slider and a box to type it, in millimetres. */
function Measure({
  label,
  value,
  min,
  max,
  step = 0.5,
  unit = 'mm',
  onChange,
}: {
  label: string;
  unit?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const id = `measure-${label.toLowerCase().replace(/\W+/g, '-')}`;
  const set = (raw: string) => {
    const n = Number(raw);
    if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
  };
  return (
    <div className="measure">
      <label htmlFor={id}>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={`${label} slider`}
        onChange={(e) => set(e.target.value)}
      />
      <span className="measure-value">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => set(e.target.value)}
        />
        <span aria-hidden="true">{unit}</span>
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

/**
 * #/id/make: the pattern as a carved object to print. Choose what to
 * make and its size, how each kind of piece is carved, and download it
 * for the slicer.
 */
export function Make({ json, address }: { json: unknown; address: string }) {
  const { model, error: loadError } = useModel(json);
  const [settings, setSettings] = useState<MakeSettings>(() => rememberedSettings(address));
  const [light, setLight] = useState(35);
  const update = (change: Partial<MakeSettings>) =>
    setSettings((s) => {
      const next = { ...s, ...change };
      if (next.depth > next.thickness - FLOOR) next.depth = next.thickness - FLOOR;
      return next;
    });
  useEffect(() => rememberSettings(address, settings), [address, settings]);

  const pattern = useMemo(() => (model ? shapeOf(model.pattern) : undefined), [model]);
  const outline = useMemo(
    () => (model ? outlineOf(model.pattern, settings) : []),
    [model, settings],
  );
  const types = model?.pattern.types ?? [];
  const carvings = useMemo(() => {
    const out: Record<number, ReturnType<typeof carvingOf>> = {
      [-1]: carvingOf(settings, 'facets'),
    };
    types.forEach((_, i) => (out[i] = carvingOf(settings, styleOf(settings, i))));
    return out;
  }, [settings, types]);
  const scale = pattern && model ? scaleOf(model.pattern, settings) : 1;
  const frame = settings.shape === 'tile' ? 0 : settings.frame;
  const carved = useCarved(pattern, {
    outline,
    scale,
    thickness: settings.thickness,
    band: settings.band,
    frame,
    carvings,
    print: settings.print,
    floor: settings.mouldFloor,
    wall: settings.mouldWall,
    gap: settings.boxGap,
    cover: settings.boxCover,
  });

  const title = model?.tutorial.title ?? 'Pattern';
  const size = outline.length ? extent(outline) : { width: 0, height: 0 };
  const printed = outline.length ? extent(printedOutline(outline, settings)) : size;
  const tall = printedHeight(settings);
  const fits = printed.width <= BED && printed.height <= BED && tall <= BED;
  const grams = carved.volume ? (carved.volume / 1000) * PLA : undefined;
  const kind = { object: '', mould: '-mould', box: '-silicone-box' }[settings.print];
  const file = `${address}-${settings.shape}-${Math.round(size.width)}mm${kind}`;
  const what = { object: 'object', mould: 'mould', box: 'box' }[settings.print];

  const setAll = (style: Style) =>
    update({ kinds: Object.fromEntries(types.map((_, i) => [i, style])) });
  const allStyle = types.length && types.every((_, i) => styleOf(settings, i) === styleOf(settings, 0))
    ? styleOf(settings, 0)
    : undefined;

  return (
    <div className="player make-page">
      <header className="make-top">
        <a className="home" href="#/" aria-label="All patterns">
          <span className="wordmark">
            Tastir{' '}
            <span className="brand-arabic" aria-hidden="true" lang="ar" dir="rtl">
              تسطير
            </span>
          </span>
        </a>
        <div className="lesson-title">
          <h1 title={title}>Make it in 3D: {title}</h1>
        </div>
        <a className="make-back" href={`#/${address}`}>
          Back to the pattern
        </a>
      </header>
      {loadError ? (
        <p className="refused" role="alert">
          {loadError}
        </p>
      ) : null}
      <div className="make-layout">
        <div className="make-stage">
          <ReliefView
            mesh={carved.mesh}
            master={carved.master}
            printed={settings.print !== 'object'}
            light={light}
            fits={fits}
            label={`The ${settings.print === 'object' ? `carved ${settings.shape}` : what} of ${title}, ${mm(printed.width)} by ${mm(printed.height)}`}
          />
          <p className="make-status" role="status">
            {!model
              ? 'Drawing the pattern…'
              : carved.busy
                ? 'Carving…'
                : ''}
          </p>
          {carved.error ? (
            <p className="refused" role="alert">
              {carved.error}
            </p>
          ) : null}
          <div className="measure make-light">
            <label htmlFor="make-light">Light from</label>
            <input
              id="make-light"
              type="range"
              min={0}
              max={360}
              value={light}
              onChange={(e) => setLight(Number(e.target.value))}
            />
          </div>
        </div>
        <aside className="side-panel make-panel" aria-label="What to make">
          <Section title="What to make">
            <div className="make-choices" role="group" aria-label="What to make">
              {SHAPES.map(({ shape, name }) => (
                <button
                  key={shape}
                  type="button"
                  aria-pressed={settings.shape === shape}
                  onClick={() => update({ shape, frame: FRAME_OF[shape] })}
                >
                  <ShapeIcon shape={shape} />
                  {name}
                </button>
              ))}
            </div>
            <p className="make-hint">
              {settings.shape === 'tile'
                ? 'One repeat of the pattern: copies fit edge to edge into a wall.'
                : settings.shape === 'round'
                  ? 'A round medallion, centred on the pattern.'
                  : 'A rectangular panel, centred on the pattern.'}
            </p>
          </Section>
          <Section title="Print">
            <div className="make-prints" role="group" aria-label="Print">
              {PRINTS.map(({ print, name }) => (
                <button
                  key={print}
                  type="button"
                  aria-pressed={settings.print === print}
                  onClick={() => update({ print })}
                >
                  <PrintIcon print={print} />
                  {name}
                </button>
              ))}
            </div>
            <p className="make-hint">{PRINTS.find((p) => p.print === settings.print)?.hint}</p>
            {settings.print === 'mould' ? (
              <>
                <Measure label="Mould floor" value={settings.mouldFloor} min={1} max={20} onChange={(mouldFloor) => update({ mouldFloor })} />
                <Measure label="Mould rim" value={settings.mouldWall} min={2} max={30} onChange={(mouldWall) => update({ mouldWall })} />
              </>
            ) : null}
            {settings.print === 'box' ? (
              <>
                <Measure label="Silicone sides" value={settings.boxGap} min={3} max={40} onChange={(boxGap) => update({ boxGap })} />
                <Measure label="Silicone top" value={settings.boxCover} min={3} max={40} onChange={(boxCover) => update({ boxCover })} />
              </>
            ) : null}
          </Section>
          <Section title="Size">
            {settings.shape === 'panel' ? (
              <>
                <Measure label="Width" value={settings.width} min={20} max={600} step={1} onChange={(width) => update({ width })} />
                <Measure label="Height" value={settings.height} min={20} max={600} step={1} onChange={(height) => update({ height })} />
              </>
            ) : null}
            {settings.shape === 'round' ? (
              <Measure label="Diameter" value={settings.width} min={20} max={600} step={1} onChange={(width) => update({ width })} />
            ) : null}
            <Measure label="One repeat" value={settings.repeat} min={10} max={400} step={1} onChange={(repeat) => update({ repeat })} />
            <Measure label="Thickness" value={settings.thickness} min={3} max={40} onChange={(thickness) => update({ thickness })} />
            {settings.shape !== 'tile' ? (
              <Measure label="Frame" value={settings.frame} min={0} max={30} onChange={(frame) => update({ frame })} />
            ) : null}
            <p className={fits ? 'make-fit' : 'make-fit too-big'}>
              {settings.print === 'object' ? '' : `The ${what}: `}
              {mm(printed.width)} × {mm(printed.height)} × {mm(tall)}:{' '}
              {fits
                ? `fits the ${BED} mm bed of the Bambu Lab A1.`
                : `larger than the ${BED} mm bed of the Bambu Lab A1. Make it smaller, or wait for splitting into parts.`}
            </p>
          </Section>
          <Section title="Carving">
            <Measure label="Depth" value={Math.min(settings.depth, settings.thickness - FLOOR)} min={0.5} max={settings.thickness - FLOOR} onChange={(depth) => update({ depth })} />
            <Measure label="Bands" value={settings.band} min={0.4} max={12} step={0.1} onChange={(band) => update({ band })} />
            {settings.band < NARROWEST_BAND ? (
              <p className="make-warning">
                Bands under {NARROWEST_BAND} mm are thinner than two lines of a 0.4 mm nozzle and may not print.
              </p>
            ) : null}
            <ul className="carve-kinds">
              <li className="carve-kind">
                <span className="carve-name">Every piece</span>
                <StylePicker label="Every piece" value={allStyle} onPick={setAll} />
              </li>
              {model
                ? types.map((t, i) => (
                    <li key={i} className="carve-kind">
                      <PieceShape model={model} type={i} color="var(--theme-bg-raised)" />
                      <span className="carve-name">
                        {pieceName(t)}
                        <small> × {t.perCell}</small>
                      </span>
                      <StylePicker
                        label={pieceName(t)}
                        value={styleOf(settings, i)}
                        onPick={(style) => update({ kinds: { ...settings.kinds, [i]: style } })}
                      />
                    </li>
                  ))
                : null}
            </ul>
          </Section>
          <Section title="Download">
            <div className="make-downloads">
              <button
                type="button"
                className="make-primary"
                disabled={!carved.mesh}
                onClick={() =>
                  carved.mesh &&
                  download(
                    new Blob([threeMf(carved.mesh, title) as BlobPart], {
                      type: 'model/3mf',
                    }),
                    `${file}.3mf`,
                  )
                }
              >
                Download 3MF
              </button>
              <button
                type="button"
                className="secondary"
                disabled={!carved.mesh}
                onClick={() =>
                  carved.mesh &&
                  download(
                    new Blob([stl(carved.mesh, title) as BlobPart], { type: 'model/stl' }),
                    `${file}.stl`,
                  )
                }
              >
                Download STL
              </button>
            </div>
            <p className="make-hint">
              3MF opens in Bambu Studio in millimetres; STL opens in any slicer.{' '}
              {settings.print === 'box'
                ? 'Print the box upright, as it stands.'
                : 'It prints face up with no supports.'}
            </p>
            {carved.mesh && carved.volume ? (
              <dl className="make-numbers">
                <dt>Volume</dt>
                <dd>{(carved.volume / 1000).toFixed(1)} cm³</dd>
                <dt>PLA if printed solid</dt>
                <dd>{Math.round(grams ?? 0)} g</dd>
                <dt>Triangles</dt>
                <dd>{(carved.mesh.triangles.length / 3).toLocaleString('en')}</dd>
              </dl>
            ) : null}
            {settings.print === 'mould' && carved.cast ? (
              <Casting cast={carved.cast} upright={carved.upright ?? 0} water={settings.water} onWater={(water) => update({ water })} />
            ) : null}
            {settings.print === 'box' && carved.cast && outline.length ? (
              <Silicone ml={siliconeFor(outline, settings.thickness, carved.cast, { gap: settings.boxGap, cover: settings.boxCover }) / 1000} />
            ) : null}
          </Section>
        </aside>
      </div>
    </div>
  );
}

function PrintIcon({ print }: { print: Print }) {
  // Cross-sections: the panel; the mould holding it upside down; the box
  // round the master.
  return (
    <svg className="shape-icon" viewBox="0 0 28 20" aria-hidden="true">
      {print === 'object' ? <path d="M2 16H26V9H21L18 13H10L7 9H2Z" /> : null}
      {print === 'mould' ? <path d="M2 4H6V9H7L10 5H18L21 9H22V4H26V17H2Z" /> : null}
      {print === 'box' ? (
        <>
          <path d="M2 2H4V17H2ZM24 2H26V17H24Z" />
          <path d="M7 17V11H10L12 14H16L18 11H21V17Z" />
        </>
      ) : null}
    </svg>
  );
}

/** How much plaster and water to mix for the cast, and how it comes out. */
function Casting({
  cast,
  upright,
  water,
  onWater,
}: {
  cast: number;
  upright: number;
  water: number;
  onWater: (water: number) => void;
}) {
  // A tenth more than the mould holds, for what stays in the bowl.
  const mix = plasterFor(cast * 1.1, water);
  return (
    <div className="make-casting">
      <h3>Plaster</h3>
      <Measure label="Water per 100 g" value={water} min={20} max={120} step={1} unit="g" onChange={onWater} />
      <p>
        The cast holds {(cast / 1000).toFixed(0)} ml. Mix <strong>{Math.round(mix.plaster)} g of plaster</strong> into{' '}
        <strong>{Math.round(mix.water)} g of water</strong>, a tenth more than it needs. Moulding plaster takes about 70 g of water to 100 g; the bag says.
      </p>
      <p className={upright > 0 ? 'make-warning' : 'make-hint'}>
        {upright > 0
          ? `${(upright / 100).toFixed(1)} cm² of wall stands upright (where the frame cuts the carving), and the sides of the cast stand upright too: brush the mould well with release agent so the cast slides out.`
          : `Every carved wall leans at least ${MOULD_DRAFT}°, so the face lets go cleanly; only the sides of the cast stand upright, so brush the mould with release agent.`}
      </p>
    </div>
  );
}

function Silicone({ ml }: { ml: number }) {
  return (
    <div className="make-casting">
      <h3>Silicone</h3>
      <p>
        About <strong>{Math.round(ml)} ml</strong> of silicone fills the box round the master, which is about{' '}
        <strong>{Math.round(ml * SILICONE)} g</strong> at {SILICONE} g/ml; the tin gives its own figure.
      </p>
    </div>
  );
}

function StylePicker({
  label,
  value,
  onPick,
}: {
  label: string;
  value: Style | undefined;
  onPick: (style: Style) => void;
}) {
  return (
    <div className="carve-styles" role="group" aria-label={`Carving of ${label}`}>
      {STYLES.map(({ style, name }) => (
        <button
          key={style}
          type="button"
          aria-pressed={value === style}
          title={name}
          onClick={() => onPick(style)}
        >
          <StyleIcon style={style} />
          <span>{name}</span>
        </button>
      ))}
    </div>
  );
}
