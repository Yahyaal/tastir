import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { bambuProject, dxf, inset, partsOf, PIN_HOLE, plasterFor, siliconeFor, stl, svg, threeMf, TRAY, zip, type BambuSettings } from '@tastir/relief';
import type { Model } from '@tastir/project-core/model';
import { ThemeSwitch } from '../app/theme';
import { FeedbackButton } from '../feedback/FeedbackButton';
import { basicFeedbackContext } from '../feedback/client';
import { colourName } from '../app/colourNames';
import {
  finishOf,
  groutOf,
  pieceColors,
  tutorialColoring,
  type Coloring,
} from '../app/coloring';
import { byPlace, colorRepeat, colouredModel, placeFills } from '../app/placement';
import { historyOf, styleColoursOf } from '../app/styleColours';
import { getPattern } from '../editor/patterns';
import { PieceShape } from '../app/drawing';
import { download } from '../app/exporting';
import type { Design } from '../app/designs';
import { draftOf } from '../app/drafts';
import { weaveOf } from '../app/interlace';
import { pieceName } from '../app/pieceNames';
import { useModel } from '../app/workerClient';
import { ReliefView } from './ReliefView';
import { MOULD_DRAFT, SPLIT_FLOOR, type MagnetChoice, type PiecesResult, type Print } from './carve';
import { shapeOf, useCarved } from './reliefClient';
import {
  BANDS,
  BED,
  BEVEL,
  MAGNET_CHOICES,
  repeatFor,
  SMALLEST_PIECE,
  thinnestFor,
  trayCutsOf,
  cellsOf,
  EDGES,
  hasTray,
  borderOf,
  bridgeOf,
  carvingOf,
  depthFor,
  cutsOf,
  extent,
  FLOOR,
  FRAME_OF,
  gapOf,
  mostGap,
  MIN_GAP,
  NARROWEST_BAND,
  NARROWEST_BRIDGE,
  outlineOf,
  PART,
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
  type Ends,
  type Edges,
  type MakeSettings,
  type Shape,
  type Style,
} from './settings';
import './make.css';

const mm = (n: number) => `${Math.round(n * 10) / 10} mm`;

/** The colouring the wall's tile style shows: a saved design's, the
 * learner's unsaved one, the colours of their own pattern, or the
 * tutorial's. */
function wallColoring(
  model: Model,
  address: string,
  saved: { coloring?: Coloring; colorings?: Parameters<typeof styleColoursOf>[1] } | undefined,
): Coloring {
  const own = address.startsWith('mine/') ? getPattern(address.slice('mine/'.length))?.wall?.coloring : undefined;
  return historyOf(
    styleColoursOf(saved?.coloring ?? own ?? tutorialColoring(model), saved?.colorings),
    'tiles',
  ).now;
}

/** Each piece's colour as the wall shows it, over one colour repeat, and
 * the grout's colour for the frame. */
function colourTable(model: Model, coloring: Coloring) {
  const coloured = colouredModel(model, coloring);
  const colors = pieceColors(coloured, coloring);
  const fill = byPlace(coloured) ? placeFills(coloured, coloring) : undefined;
  const [m, n] = fill ? colorRepeat(coloured) : ([1, 1] as const);
  const out: string[] = [];
  coloured.pattern.pieces.forEach((p, k) => {
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++) out.push(fill ? fill(k, i, j) : (colors[p.type] ?? '#999999'));
  });
  return {
    colours: { repeat: [m, n] as [number, number], fill: out },
    frameColour: groutOf(finishOf(coloured, coloring)),
  };
}

/** A small cross-section of each carving: band, then the cut. */
function StyleIcon({ style }: { style: Style }) {
  const d = {
    facets: 'M1 5 H6 L14 15 L22 5 H27',
    flat: 'M1 5 H6 L7.5 15 H20.5 L22 5 H27',
    cushion: 'M1 5 H6 L7 15 Q14 6 21 15 L22 5 H27',
    raised: 'M1 5 H27',
    pierced: '',
  }[style];
  return (
    <svg className="style-icon" viewBox="0 0 28 18" aria-hidden="true">
      {style === 'pierced' ? <path d="M1 5 H6 V17 H1 Z M22 5 H27 V17 H22 Z" /> : <path d={`${d} V17 H1 Z`} />}
    </svg>
  );
}

function ShapeIcon({ shape }: { shape: Shape }) {
  return (
    <svg className="shape-icon" viewBox="0 0 24 24" aria-hidden="true">
      {shape === 'panel' ? <rect x="3" y="3" width="18" height="18" rx="1" /> : null}
      {shape === 'round' ? <circle cx="12" cy="12" r="9.5" /> : null}
      {shape === 'tile' ? <path d="M12 2.5 20.2 7.25V16.75L12 21.5 3.8 16.75V7.25Z" /> : null}
      {shape === 'border' ? <path d="M1.5 8H22.5L19 16H5Z" /> : null}
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
  const id = useId();
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
export function Make({
  json,
  address,
  design,
}: {
  json: unknown;
  address: string;
  /** A saved design: carved with its own inking, its settings kept apart. */
  design?: Design;
}) {
  // The pattern as the wall shows it: a saved design's inking, or the
  // learner's unsaved changes to the tutorial's.
  const [draft] = useState(() => (design ? undefined : draftOf(address)));
  const inked = design ? design.inked : draft?.inked;
  const { model, error: loadError } = useModel(json, inked);
  const key = design ? `${address}/design/${design.id}` : address;
  const [settings, setSettings] = useState<MakeSettings>(() => rememberedSettings(key));
  const [light, setLight] = useState(35);
  const downloadSectionRef = useRef<HTMLDivElement>(null);
  const update = (change: Partial<MakeSettings>) =>
    setSettings((s) => {
      const next = { ...s, ...change };
      if (next.depth > next.thickness - FLOOR) next.depth = next.thickness - FLOOR;
      return next;
    });
  useEffect(() => rememberSettings(key, settings), [key, settings]);

  const pattern = useMemo(
    () =>
      model
        ? shapeOf(model.pattern, model.tutorial.pattern.woven === false ? undefined : weaveOf(model.pattern))
        : undefined,
    [model],
  );
  const weaves = pattern?.weave !== undefined;
  const outline = useMemo(
    () => (model ? outlineOf(model.pattern, settings) : []),
    [model, settings],
  );
  const types = model?.pattern.types ?? [];
  const isPieces = settings.print === 'pieces';
  const table = useMemo(
    () => (model && isPieces ? colourTable(model, wallColoring(model, address, design ?? draft)) : undefined),
    [model, isPieces, address, design, draft],
  );
  const pieceThickness = Math.max(settings.pieceThickness, thinnestFor(settings.magnet));
  const carvings = useMemo(() => {
    const out: Record<number, ReturnType<typeof carvingOf>> = {
      [-1]: carvingOf(settings, 'facets'),
    };
    types.forEach((_, i) => (out[i] = carvingOf(settings, styleOf(settings, i), i)));
    return out;
  }, [settings, types]);
  const scale = pattern && model ? scaleOf(model.pattern, settings) : 1;
  const frame = settings.shape === 'tile' ? 0 : settings.frame;
  const whole = isPieces && settings.edges === 'whole';
  const tray = hasTray(settings);
  const cuts = useMemo(
    () => (pattern ? cutsOf(pattern, outline, settings) : { xs: [], ys: [] }),
    [pattern, outline, settings],
  );
  const split = cuts.xs.length > 0 || cuts.ys.length > 0;
  const partCount = split && outline.length ? partsOf(printedOutline(outline, settings), cuts).length : 1;
  const carved = useCarved(pattern, {
    outline,
    scale,
    thickness: settings.thickness,
    band: settings.band,
    frame,
    bands: settings.bands,
    weaveGap: weaves && settings.woven ? gapOf(settings) : 0,
    carvings,
    print: settings.print,
    floor: settings.mouldFloor,
    wall: settings.mouldWall,
    gap: settings.boxGap,
    cover: settings.boxCover,
    cuts,
    ...(isPieces && table
      ? {
          pieces: {
            thickness: pieceThickness,
            joint: settings.joint,
            bevel: settings.bevel ? BEVEL : 0,
            magnet: settings.magnet,
            tray,
            ...(whole ? { whole: true, ...(settings.shape === 'tile' ? { cells: cellsOf(settings) } : {}) } : {}),
            ...table,
            names: types.map((t) => pieceName(t)),
            trayCuts: trayCutsOf(outline, settings),
          },
        }
      : {}),
  });
  const set = isPieces ? carved.set : undefined;

  const title = design ? design.name : (model?.tutorial.title ?? 'Pattern');
  const size = outline.length ? extent(outline) : { width: 0, height: 0 };
  const printed = outline.length ? extent(printedOutline(outline, settings)) : size;
  const tall = printedHeight(settings, split);
  // Parts are cut no larger than PART, which fits the bed.
  const fits = (split || (printed.width <= BED && printed.height <= BED)) && tall <= BED;
  const grams = carved.volume ? (carved.volume / 1000) * PLA : undefined;
  const kind = { object: '', mould: '-mould', box: '-silicone-box', pieces: '-pieces' }[settings.print];
  const slug = design ? `${address}-${design.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'design'}` : address;
  const file = `${slug}-${settings.shape}-${Math.round(size.width)}mm${kind}`;
  const what = { object: 'object', mould: 'mould', box: 'box', pieces: tray ? 'tray' : 'pieces' }[settings.print];
  const parts = carved.parts;
  const boxInside = settings.print === 'box' && outline.length ? extent(inset(outline, -settings.boxGap)) : undefined;

  const setAll = (style: Style) =>
    update({ kinds: Object.fromEntries(types.map((_, i) => [i, style])) });
  const bridge = bridgeOf(settings, types.length);
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
        <div className="make-top-actions">
          <a className="make-back" href={design ? `#/${address}/design/${design.id}` : `#/${address}`}>
            Back to the pattern
          </a>
          <FeedbackButton
            iconOnly
            context={basicFeedbackContext(address, `3D: ${title}`, 'result')}
          />
          <ThemeSwitch />
        </div>
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
            master={set ? undefined : carved.master}
            coloured={set?.colours}
            tray={set ? carved.master : undefined}
            printed={settings.print !== 'object' && !set}
            light={light}
            fits={fits}
            label={
              set
                ? `The ${set.pieces} pieces of ${title}, laid out with their joints, ${mm(size.width)} by ${mm(size.height)}`
                : `The ${settings.print === 'object' ? `carved ${settings.shape}` : what} of ${title}, ${mm(printed.width)} by ${mm(printed.height)}`
            }
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
              aria-valuetext={`${light}°`}
              onChange={(e) => setLight(Number(e.target.value))}
            />
            <span className="make-light-angle" aria-hidden="true">
              {light}°
            </span>
          </div>
        </div>
        <aside className="side-panel make-panel" aria-label="What to make">
          <div className="make-quick-bar">
            <span className="make-quick-summary">
              {set
                ? `${set.pieces} pieces · ${set.plates.length} ${set.plates.length === 1 ? 'plate' : 'plates'}`
                : `${mm(printed.width)} × ${mm(printed.height)}`}
            </span>
            <button
              type="button"
              className="make-jump-download"
              onClick={() =>
                downloadSectionRef.current?.scrollIntoView?.({
                  behavior: 'smooth',
                  block: 'start',
                })
              }
            >
              Download ↓
            </button>
          </div>
          <Section title="What to make">
            <div className="make-choices" role="group" aria-label="What to make">
              {SHAPES.map(({ shape, name }) => (
                <button
                  key={shape}
                  type="button"
                  aria-pressed={settings.shape === shape}
                  onClick={() =>
                    update({
                      shape,
                      frame: FRAME_OF[shape],
                      ...(shape === 'border' && settings.shape !== 'border' ? borderOf(settings) : {}),
                    })
                  }
                >
                  <ShapeIcon shape={shape} />
                  {name}
                </button>
              ))}
            </div>
            {settings.shape === 'border' ? (
              <div className="make-choices make-ends" role="group" aria-label="Ends">
                {(['square', 'mitred'] as Ends[]).map((ends) => (
                  <button key={ends} type="button" aria-pressed={settings.ends === ends} onClick={() => update({ ends })}>
                    {ends === 'square' ? 'Square ends' : 'Mitred ends'}
                  </button>
                ))}
              </div>
            ) : null}
            <p className="make-hint">
              {settings.shape === 'border'
                ? settings.ends === 'mitred'
                  ? 'A long strip with its ends cut at 45°: four of them frame a panel or a mirror.'
                  : 'A long strip of the pattern, cut into parts that fit the bed.'
                : settings.shape === 'tile'
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
            {isPieces ? (
              <PieceOptions
                joint={settings.joint}
                bevel={settings.bevel}
                magnet={settings.magnet}
                tray={settings.tray}
                edges={settings.edges}
                onChange={update}
              />
            ) : null}
            {settings.print === 'box' ? (
              <>
                <Measure label="Silicone sides" value={settings.boxGap} min={3} max={40} onChange={(boxGap) => update({ boxGap })} />
                <Measure label="Silicone top" value={settings.boxCover} min={3} max={40} onChange={(boxCover) => update({ boxCover })} />
              </>
            ) : null}
          </Section>
          <Section title="Size">
            {settings.shape === 'panel' || settings.shape === 'border' ? (
              <>
                <Measure label={settings.shape === 'border' ? 'Length' : 'Width'} value={settings.width} min={20} max={1000} step={1} onChange={(width) => update({ width })} />
                <Measure label="Height" value={settings.height} min={20} max={settings.shape === 'border' ? 400 : 1000} step={1} onChange={(height) => update({ height })} />
              </>
            ) : null}
            {settings.shape === 'round' ? (
              <Measure label="Diameter" value={settings.width} min={20} max={1000} step={1} onChange={(width) => update({ width })} />
            ) : null}
            <Measure label="One repeat" value={settings.repeat} min={10} max={400} step={1} onChange={(repeat) => update({ repeat })} />
            {isPieces ? (
              <Measure
                label="Thickness"
                value={pieceThickness}
                min={thinnestFor(settings.magnet)}
                max={20}
                onChange={(t) => update({ pieceThickness: t })}
              />
            ) : (
              <Measure label="Thickness" value={settings.thickness} min={3} max={40} onChange={(thickness) => update({ thickness })} />
            )}
            {whole && settings.shape === 'tile' ? (
              <>
                <Measure label="Repeats across" unit="" value={settings.across} min={1} max={10} step={1} onChange={(across) => update({ across })} />
                <Measure label="Repeats down" unit="" value={settings.down} min={1} max={10} step={1} onChange={(down) => update({ down })} />
              </>
            ) : null}
            {settings.shape !== 'tile' && !whole ? (
              <Measure label="Frame" value={settings.frame} min={0} max={30} onChange={(frame) => update({ frame })} />
            ) : null}
            {isPieces ? (
              <p className="make-fit">
                {whole && settings.shape === 'tile'
                  ? `${settings.across} × ${settings.down} ${settings.across * settings.down === 1 ? 'repeat' : 'repeats'} of ${mm(settings.repeat)}`
                  : `${whole ? 'About ' : ''}${mm(size.width)} × ${mm(size.height)}`}
                {set
                  ? `: ${set.pieces} pieces on ${set.plates.length} plates of the ${BED} mm bed of the Bambu Lab A1${set.tray ? `, and a tray in ${set.tray.length === 1 ? 'one part' : `${set.tray.length} parts`}` : ''}.`
                  : '.'}
              </p>
            ) : (
            <p className={fits ? 'make-fit' : 'make-fit too-big'}>
              {settings.print === 'object' ? '' : `The ${what}: `}
              {mm(printed.width)} × {mm(printed.height)} × {mm(tall)}:{' '}
              {!fits
                ? settings.print === 'box'
                  ? `larger than the ${BED} mm bed of the Bambu Lab A1, so build the box from boards instead: ${mm(boxInside?.width ?? 0)} × ${mm(boxInside?.height ?? 0)} inside and ${mm(settings.thickness + settings.boxCover)} tall.`
                  : `taller than the ${BED} mm bed of the Bambu Lab A1 allows.`
                : split
                  ? `in ${partCount} parts, none longer than ${PART} mm, so each fits the ${BED} mm bed of the Bambu Lab A1.`
                  : `fits the ${BED} mm bed of the Bambu Lab A1.`}
            </p>
            )}
            {set && set.smallest > 0 && set.smallest < SMALLEST_PIECE ? (
              <p className="make-warning">
                The smallest piece is {mm(set.smallest)} across, under {SMALLEST_PIECE} mm, so it is hard to print and to
                hold: a repeat of {repeatFor(settings, set.smallest)} mm brings it to {SMALLEST_PIECE} mm.
              </p>
            ) : null}
          </Section>
          {isPieces ? null : (
          <Section title="Carving">
            <Measure label="Depth" value={Math.min(settings.depth, settings.thickness - FLOOR)} min={0.5} max={settings.thickness - FLOOR} onChange={(depth) => update({ depth })} />
            <Measure label="Bands" value={settings.band} min={0.4} max={12} step={0.1} onChange={(band) => update({ band })} />
            <div className="make-choices make-bands" role="group" aria-label="Band shape">
              {BANDS.map(({ bands, name }) => (
                <button key={bands} type="button" aria-pressed={settings.bands === bands} onClick={() => update({ bands })}>
                  <BandIcon bands={bands} />
                  {name}
                </button>
              ))}
            </div>
            {weaves ? (
              <>
                <label className="make-switch">
                  <input type="checkbox" checked={settings.woven} onChange={(e) => update({ woven: e.target.checked })} />
                  Woven: one band passes under the other at each crossing
                </label>
                {settings.woven ? (
                  <Measure
                    label="Gap"
                    value={gapOf(settings)}
                    min={MIN_GAP}
                    max={mostGap(settings)}
                    step={0.1}
                    onChange={(gap) => update({ gap })}
                  />
                ) : null}
              </>
            ) : null}
            {bridge !== undefined ? (
              <p className={bridge < NARROWEST_BRIDGE ? 'make-warning' : 'make-hint'}>
                Narrowest bridge of the screen: {mm(bridge)}
                {bridge < NARROWEST_BRIDGE
                  ? `, under ${NARROWEST_BRIDGE} mm, so it may break: widen the bands${settings.frame > 0 && settings.frame < settings.band ? ' or the frame' : ''}.`
                  : ', where the band runs between two holes.'}
              </p>
            ) : null}
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
                      {styleOf(settings, i) !== 'raised' && styleOf(settings, i) !== 'pierced' ? (
                        <KindDepth
                          name={pieceName(t)}
                          value={depthFor(settings, i)}
                          own={settings.depths[i] !== undefined}
                          max={settings.thickness - FLOOR}
                          onChange={(depth) =>
                            update({
                              depths:
                                depth === undefined
                                  ? Object.fromEntries(Object.entries(settings.depths).filter(([k]) => Number(k) !== i))
                                  : { ...settings.depths, [i]: depth },
                            })
                          }
                        />
                      ) : null}
                    </li>
                  ))
                : null}
            </ul>
          </Section>
          )}
          <div ref={downloadSectionRef} className="make-download-anchor">
          <Section title="Download">
            {set ? <PieceDownloads set={set} file={file} title={title} /> : null}
            {set ? null : (
            <div className="make-downloads">
              <button
                type="button"
                className="make-primary"
                disabled={!carved.mesh}
                onClick={() =>
                  carved.mesh &&
                  download(
                    new Blob([threeMf(parts ?? carved.mesh, title) as BlobPart], {
                      type: 'model/3mf',
                    }),
                    `${file}${parts ? '-parts' : ''}.3mf`,
                  )
                }
              >
                Download 3MF
              </button>
              <button
                type="button"
                className="secondary"
                disabled={!carved.mesh}
                onClick={() => {
                  if (!carved.mesh) return;
                  if (parts)
                    download(
                      new Blob(
                        [
                          zip(
                            parts.map((p) => ({ name: `${file}-${p.name}.stl`, data: stl(p.mesh, `${title} ${p.name}`) })),
                          ) as BlobPart,
                        ],
                        { type: 'application/zip' },
                      ),
                      `${file}-parts-stl.zip`,
                    );
                  else
                    download(
                      new Blob([stl(carved.mesh, title) as BlobPart], { type: 'model/stl' }),
                      `${file}.stl`,
                    );
                }}
              >
                {parts ? 'Download STLs (zip)' : 'Download STL'}
              </button>
            </div>
            )}
            <div className="make-downloads make-flat">
              <button
                type="button"
                className="secondary"
                disabled={!carved.lines}
                onClick={() =>
                  carved.lines &&
                  download(new Blob([svg(carved.lines, title)], { type: 'image/svg+xml' }), `${file}-lines.svg`)
                }
              >
                Download SVG
              </button>
              <button
                type="button"
                className="secondary"
                disabled={!carved.lines}
                onClick={() =>
                  carved.lines && download(new Blob([dxf(carved.lines)], { type: 'image/vnd.dxf' }), `${file}-lines.dxf`)
                }
              >
                Download DXF
              </button>
            </div>
            <p className="make-hint">
              {set
                ? 'SVG and DXF are every piece’s outline in millimetres, joints and all, to cut the pieces from sheets with a laser or a router.'
                : `SVG and DXF are the ${settings.shape} flat, in millimetres, for a laser cutter, a CNC router or a stencil: the outline and every hole to cut in red, the edge of each carved piece to engrave in blue.`}
            </p>
            {set ? <PieceList set={set} names={types.map((t) => pieceName(t))} repeats={whole && settings.shape === 'tile' ? settings.across * settings.down : 0} /> : null}
            {parts ? <Parts parts={parts} pins={carved.pins ?? 0} pinless={carved.pinless} mould={settings.print === 'mould'} floor={settings.mouldFloor} /> : null}
            {set ? null : (
            <p className="make-hint">
              {parts
                ? 'The 3MF holds every part as its own object: in Bambu Studio, arrange them one or more to a plate. The zip holds one STL to a part.'
                : '3MF opens in Bambu Studio in millimetres; STL opens in any slicer.'}{' '}
              {settings.print === 'box'
                ? 'Print the box upright, as it stands.'
                : 'It prints face up with no supports.'}
            </p>
            )}
            {carved.mesh && carved.volume ? (
              <dl className="make-numbers">
                <dt>Volume</dt>
                <dd>{(carved.volume / 1000).toFixed(1)} cm³</dd>
                <dt>{set ? 'PLA, every piece solid' : 'PLA if printed solid'}</dt>
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
          </div>
        </aside>
      </div>
    </div>
  );
}

/** The parts, their sizes, and the pins that join them. */
function Parts({
  parts,
  pins,
  pinless,
  mould,
  floor,
}: {
  parts: readonly { name: string; width: number; height: number; pins: number }[];
  pins: number;
  pinless: 'thin' | 'pierced' | undefined;
  mould: boolean;
  floor: number;
}) {
  // A pin fills both holes, less half a millimetre at each end.
  const length = 2 * PIN_HOLE.depth - 1;
  return (
    <div className="make-casting make-parts">
      <h3>{parts.length} parts</h3>
      <ul>
        {parts.map((p) => (
          <li key={p.name}>
            <strong>{p.name}</strong> {Math.round(p.width)} × {Math.round(p.height)} mm
          </li>
        ))}
      </ul>
      <p>
        {pins > 0 ? (
          <>
            Cut <strong>{pins} pins</strong> of 1.75 mm filament, <strong>{length} mm long</strong>. Push them into the
            holes along each seam, glue the edges, and press the parts together; A1 is the top left part seen from above.
          </>
        ) : (
          `${pinless === 'pierced' ? 'A pin could open into a hole of the screen' : 'The solid under the carving is too thin for pins'}, so glue the parts edge to edge on a flat board.`
        )}
        {mould && floor < SPLIT_FLOOR && pins > 0 ? ` The mould's floor is ${SPLIT_FLOOR} mm in parts, so the pins fit.` : ''}
      </p>
    </div>
  );
}

/** One kind of piece's own depth, or the common one with a way back. */
function KindDepth({
  name,
  value,
  own,
  max,
  onChange,
}: {
  name: string;
  value: number;
  own: boolean;
  max: number;
  onChange: (depth: number | undefined) => void;
}) {
  return (
    <div className="carve-depth">
      <Measure label={`Depth of ${name}`} value={value} min={0.5} max={max} onChange={onChange} />
      {own ? (
        <button type="button" className="link-button" onClick={() => onChange(undefined)}>
          Use the common depth
        </button>
      ) : null}
    </div>
  );
}

/** A band's cross-section. */
function BandIcon({ bands }: { bands: string }) {
  const d = {
    flat: 'M2 14V6H26V14Z',
    rounded: 'M2 14V9Q14 1 26 9V14Z',
    double: 'M2 14V5H12L13 9H15L16 5H26V14Z',
  }[bands];
  return (
    <svg className="shape-icon" viewBox="0 0 28 16" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function PrintIcon({ print }: { print: Print }) {
  // Cross-sections: the panel; the mould holding it upside down; the box
  // round the master.
  return (
    <svg className="shape-icon" viewBox="0 0 28 20" aria-hidden="true">
      {print === 'object' ? <path d="M2 16H26V9H21L18 13H10L7 9H2Z" /> : null}
      {print === 'mould' ? <path d="M2 4H6V9H7L10 5H18L21 9H22V4H26V17H2Z" /> : null}
      {print === 'pieces' ? <path d="M2 17V11H9V17ZM11 17V8L15 5L19 8V17ZM21 17L23.5 10L26 17Z" /> : null}
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

/** The joint, the bevel, the magnet and the tray. */
function PieceOptions({
  joint,
  bevel,
  magnet,
  tray,
  edges,
  onChange,
}: {
  joint: number;
  bevel: boolean;
  magnet: MagnetChoice;
  tray: boolean;
  edges: Edges;
  onChange: (change: Partial<MakeSettings>) => void;
}) {
  return (
    <>
      <div className="make-choices" role="group" aria-label="Edges">
        {EDGES.map((e) => (
          <button key={e.edges} type="button" aria-pressed={edges === e.edges} onClick={() => onChange({ edges: e.edges })}>
            {e.name}
          </button>
        ))}
      </div>
      <p className="make-hint">{EDGES.find((e) => e.edges === edges)?.hint}</p>
      <Measure label="Joint" value={joint} min={0} max={3} step={0.1} onChange={(j) => onChange({ joint: j })} />
      <p className="make-hint">
        The gap between two pieces. Each piece is {mm(joint / 2)} smaller on every side, so printed pieces, which come
        out a little large, still lie side by side.
      </p>
      <label className="make-switch">
        <input type="checkbox" checked={bevel} onChange={(e) => onChange({ bevel: e.target.checked })} />
        Bevel the top edge ({BEVEL} mm at 45°), so each joint reads as a line
      </label>
      <div className="make-choices make-magnets" role="group" aria-label="Magnet">
        {MAGNET_CHOICES.map((m) => (
          <button key={m.magnet} type="button" aria-pressed={magnet === m.magnet} onClick={() => onChange({ magnet: m.magnet })}>
            {m.name}
          </button>
        ))}
      </div>
      <p className="make-hint">
        {magnet === 'none'
          ? edges === 'cut' ? 'No magnets: the pieces lie loose, or in the tray.' : 'No magnets: the pieces lie loose.'
          : 'A disc magnet in a pocket under each piece, so the pieces hold on a steel sheet, a fridge or a whiteboard. Press it in or add a drop of glue; either face holds on steel.'}
      </p>
      {edges === 'cut' ? (
        <label className="make-switch">
          <input type="checkbox" checked={tray} onChange={(e) => onChange({ tray: e.target.checked })} />
          A tray to lay the pieces in, {TRAY.rim} mm deep
        </label>
      ) : null}
    </>
  );
}

/** How many pieces of each kind in each colour, the plates, and the
 * magnets to buy. */
function PieceList({ set, names, repeats }: { set: PiecesResult; names: readonly string[]; repeats: number }) {
  const colours = [...new Set(set.counts.map((c) => c.colour))];
  const magnetText = MAGNET_CHOICES.filter((m) => set.magnets[m.magnet]).map(
    (m) => `${set.magnets[m.magnet]} of ${m.name}`,
  );
  return (
    <div className="make-casting make-pieces">
      <h3>{set.pieces} pieces</h3>
      {repeats ? (
        <p>
          {set.pieces / repeats} pieces to a repeat. Each repeat is a whole set: print more later and lay them on any side
          to make the wall larger.
        </p>
      ) : null}
      <ul className="piece-colours">
        {colours.map((colour) => {
          const plates = set.plates.filter((p) => p.colour === colour);
          const grams = (plates.reduce((v, p) => v + p.volume, 0) / 1000) * PLA;
          return (
            <li key={colour}>
              <span className="piece-swatch" style={{ background: colour }} aria-hidden="true" />
              <div>
                <strong>{colourName(colour)}</strong>: {plates.length} {plates.length === 1 ? 'plate' : 'plates'}, {Math.round(grams)} g
                <ul>
                  {set.counts
                    .filter((c) => c.colour === colour)
                    .map((c) => (
                      <li key={c.type}>
                        {c.type < 0 ? 'frame strip' : (names[c.type] ?? 'piece')} × {c.whole + c.cut}
                        {c.cut && c.type >= 0 ? ` (${c.cut} cut at the edge)` : ''}
                      </li>
                    ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
      <p>
        {magnetText.length ? (
          <>
            Magnets to buy: <strong>{magnetText.join(' and ')}</strong>
            {set.without ? `; ${set.without} ${set.without === 1 ? 'piece is' : 'pieces are'} too small for one` : ''}.
          </>
        ) : set.without ? (
          `Every piece is too small for a magnet.`
        ) : (
          'No magnets.'
        )}
        {set.dropped ? ` ${set.dropped} slivers at the edge, under 1 mm, are left out.` : ''}
      </p>
      <p className="make-hint">
        Each plate is one colour, so it prints in one filament with no colour changes. Download for Bambu Studio gives
        one file: double-click it and Bambu Studio opens every plate, each in its colour, with the A1&apos;s settings.
        Each piece is named by its colour, its kind and its number on the layout.
      </p>
    </div>
  );
}

/** One Bambu Studio project: every plate, each in its colour's filament,
 * with the A1's settings, which Bambu Studio needs to open the plates. */
async function bambuFile(set: PiecesResult, title: string, file: string) {
  const settings = (await import('./bambu-a1.json')).default as unknown as BambuSettings;
  const colours = [...new Set(set.plates.map((p) => p.colour))];
  const data = bambuProject(
    set.plates.map((p) => ({ name: p.name, filament: colours.indexOf(p.colour) + 1, items: p.items })),
    title,
    { settings, colours },
  );
  download(new Blob([data as BlobPart], { type: 'model/3mf' }), `${file}.3mf`);
}

/** The project, the plates apart, the layout and the tray. */
function PieceDownloads({ set, file, title }: { set: PiecesResult; file: string; title: string }) {
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (
    <div className="make-downloads">
      <button type="button" className="make-primary" onClick={() => void bambuFile(set, title, file)}>
        Download for Bambu Studio
      </button>
      <button
        type="button"
        className="secondary"
        onClick={() =>
          download(
            new Blob(
              [
                zip(
                  set.plates.map((p, i) => ({
                    name: `${String(i + 1).padStart(2, '0')}-${slug(p.name)}.3mf`,
                    data: threeMf(p.items, `${title}: ${p.name}`),
                  })),
                ) as BlobPart,
              ],
              { type: 'application/zip' },
            ),
            `${file}-plates.zip`,
          )
        }
      >
        Plates as separate files (zip)
      </button>
      <button
        type="button"
        className="secondary"
        onClick={() => download(new Blob([set.layout], { type: 'image/svg+xml' }), `${file}-layout.svg`)}
      >
        Download layout
      </button>
      {set.tray ? (
        <button
          type="button"
          className="secondary"
          onClick={() =>
            set.tray &&
            download(
              new Blob([threeMf(set.tray.length === 1 ? set.tray[0]!.mesh : set.tray, `${title}: tray`) as BlobPart], {
                type: 'model/3mf',
              }),
              `${file}-tray.3mf`,
            )
          }
        >
          Download tray
        </button>
      ) : null}
    </div>
  );
}
