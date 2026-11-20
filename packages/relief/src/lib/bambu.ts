import type { Mesh } from './mesh.js';
import { utf8, zip } from './threemf.js';

/**
 * A Bambu Studio project: one 3MF that opens with its plates already made,
 * each named and holding its own objects. It is laid out the way Bambu
 * Studio writes its own projects: each object's mesh in its own file under
 * 3D/Objects, the build placing each one, and Metadata/model_settings.config
 * naming the objects and listing which sit on which plate. No printer,
 * filament or process settings are written, so Bambu Studio keeps the ones
 * the learner chose.
 *
 * Bambu Studio sets its plates side by side, a fifth of a bed apart, in
 * rows of as many plates as the square root of their number (rounded up);
 * an object is on a plate when it lies over it, so each object is moved by
 * its plate's place there.
 */

export interface ProjectPlate {
  readonly name: string;
  /** The filament it prints in, from 1 (the colours' order). */
  readonly filament?: number;
  /** Each object, in place on a bed `bed` millimetres square from (0, 0). */
  readonly items: readonly { readonly name: string; readonly mesh: Mesh }[];
}

/** Settings saved by Bambu Studio for one printer, process and filament,
 * which make the project open with its plates: without them Bambu Studio
 * loads the shapes only. Each setting kept per filament holds the one
 * filament's, and is repeated for every colour. */
export interface BambuSettings {
  /** The Bambu Studio version that saved them, like 02.09.01.70. */
  readonly version: string;
  /** The flush between two filaments, in mm³. */
  readonly flush: number;
  readonly perFilament: readonly string[];
  readonly config: Readonly<Record<string, string | readonly string[]>>;
}

/** The version a project without settings says it comes from. */
export const BAMBU_VERSION = '01.08.00.00';
/** The gap between plates, as a share of the bed. */
const PLATE_GAP = 1 / 5;

/** Where plate n (from 0) lies in the project, out of `count`. */
export function plateOrigin(n: number, count: number, bed: number): { x: number; y: number } {
  const cols = plateColumns(count);
  const stride = bed * (1 + PLATE_GAP);
  return { x: (n % cols) * stride, y: 0 - Math.floor(n / cols) * stride };
}

/** How many plates to a row: Bambu Studio's own rule. */
export function plateColumns(count: number): number {
  const v = Math.sqrt(count);
  const r = Math.round(v);
  return Math.max(1, v > r ? r + 1 : r);
}

/**
 * What every Tastir project sets over the saved settings, so small pieces
 * hold to the plate. A piece touches the plate over a few square
 * centimetres, less its magnet pocket: a fast first layer drags it loose,
 * and the part fan, on from the second layer, cools its points until they
 * curl up. So each piece gets an outer brim (left to itself Bambu Studio
 * adds none to pieces this small), with a gap that lets it peel off
 * clean; the first layer is slowed; and the fan waits three layers. A
 * setting kept as a list keeps its length, with this value in each place.
 */
export const STEADY_START: Readonly<Record<string, string>> = {
  brim_type: 'outer_only',
  brim_width: '3',
  brim_object_gap: '0.15',
  initial_layer_speed: '30',
  initial_layer_infill_speed: '60',
  close_fan_the_first_x_layers: '3',
};

/** The settings for these colours: every per-filament setting repeated
 * once a colour, in that colour, and the steady start over them. */
export function projectSettings(s: BambuSettings, colours: readonly string[]): Record<string, string | string[]> {
  const n = Math.max(1, colours.length);
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(s.config)) out[key] = Array.isArray(value) ? value.slice() : (value as string);
  for (const key of s.perFilament) {
    const one = s.config[key];
    if (Array.isArray(one)) out[key] = Array.from({ length: n }, () => one).flat();
  }
  for (const [key, value] of Object.entries(STEADY_START)) {
    const was = out[key];
    out[key] = Array.isArray(was) ? was.map(() => value) : value;
  }
  out.filament_colour = Array.from({ length: n }, (_, k) => (colours[k] ?? '#FFFFFF').toUpperCase());
  out.filament_self_index = Array.from({ length: n }, (_, k) => String(k + 1));
  out.flush_volumes_matrix = Array.from({ length: n * n }, (_, k) =>
    Math.floor(k / n) === k % n ? '0' : String(s.flush),
  );
  return out;
}

export function bambuProject(
  plates: readonly ProjectPlate[],
  title: string,
  options: { readonly settings?: BambuSettings; readonly colours?: readonly string[]; readonly bed?: number } = {},
): Uint8Array {
  const bed = options.bed ?? 256;
  const version = options.settings?.version ?? BAMBU_VERSION;
  const num = (x: number) => String(Math.round(x * 1e5) / 1e5);
  const objectFiles: { name: string; data: Uint8Array }[] = [];
  const main: string[] = [];
  const build: string[] = [];
  const settings: string[] = [];
  const plateXml: string[] = [];
  let next = 1;
  plates.forEach((plate, n) => {
    const origin = plateOrigin(n, plates.length, bed);
    const instances: string[] = [];
    for (const item of plate.items) {
      const meshId = next++;
      const objectId = next++;
      const path = `/3D/Objects/object_${meshId}.model`;
      // The mesh about its own middle, as Bambu Studio keeps it, and the
      // build moving it there and onto its plate.
      const p = item.mesh.positions;
      const lo = [Infinity, Infinity, Infinity];
      const hi = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < p.length; i++) {
        lo[i % 3] = Math.min(lo[i % 3]!, p[i]!);
        hi[i % 3] = Math.max(hi[i % 3]!, p[i]!);
      }
      const mid = lo.map((l, a) => (l + hi[a]!) / 2);
      const body: string[] = [`<object id="${meshId}" p:UUID="${uuid(meshId, 1)}" type="model">\n<mesh>\n<vertices>\n`];
      for (let i = 0; i < p.length; i += 3)
        body.push(`<vertex x="${num(p[i]! - mid[0]!)}" y="${num(p[i + 1]! - mid[1]!)}" z="${num(p[i + 2]! - mid[2]!)}"/>\n`);
      body.push('</vertices>\n<triangles>\n');
      const t = item.mesh.triangles;
      for (let i = 0; i < t.length; i += 3) body.push(`<triangle v1="${t[i]}" v2="${t[i + 1]}" v3="${t[i + 2]}"/>\n`);
      body.push('</triangles>\n</mesh>\n</object>\n');
      objectFiles.push({
        name: path.slice(1),
        data: utf8(
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
            `<model unit="millimeter" xml:lang="en-US" ${NAMESPACES} requiredextensions="p">\n` +
            `<metadata name="BambuStudio:3mfVersion">1</metadata>\n<resources>\n${body.join('')}</resources>\n<build/>\n</model>\n`,
        ),
      });
      main.push(
        `<object id="${objectId}" p:UUID="${uuid(objectId, 2)}" type="model">\n` +
          `<components>\n<component p:path="${path}" objectid="${meshId}" p:UUID="${uuid(meshId, 3)}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>\n</components>\n</object>\n`,
      );
      const at = [mid[0]! + origin.x, mid[1]! + origin.y, mid[2]!];
      build.push(
        `<item objectid="${objectId}" p:UUID="${uuid(objectId, 4)}" transform="1 0 0 0 1 0 0 0 1 ${at.map(num).join(' ')}" printable="1"/>\n`,
      );
      const name = escapeXml(item.name);
      settings.push(
        `  <object id="${objectId}">\n` +
          `    <metadata key="name" value="${name}"/>\n` +
          `    <metadata key="extruder" value="${plate.filament ?? 1}"/>\n` +
          `    <part id="${meshId}" subtype="normal_part">\n` +
          `      <metadata key="name" value="${name}"/>\n` +
          '      <metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>\n' +
          '    </part>\n' +
          '  </object>\n',
      );
      instances.push(
        '    <model_instance>\n' +
          `      <metadata key="object_id" value="${objectId}"/>\n` +
          '      <metadata key="instance_id" value="0"/>\n' +
          `      <metadata key="identify_id" value="${objectId}"/>\n` +
          '    </model_instance>\n',
      );
    }
    plateXml.push(
      '  <plate>\n' +
        `    <metadata key="plater_id" value="${n + 1}"/>\n` +
        `    <metadata key="plater_name" value="${escapeXml(plate.name)}"/>\n` +
        '    <metadata key="locked" value="false"/>\n' +
        instances.join('') +
        '  </plate>\n',
    );
  });
  const model =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<model unit="millimeter" xml:lang="en-US" ${NAMESPACES} requiredextensions="p">\n` +
    `<metadata name="Application">BambuStudio-${version}</metadata>\n` +
    '<metadata name="BambuStudio:3mfVersion">1</metadata>\n' +
    `<metadata name="Title">${escapeXml(title)}</metadata>\n` +
    '<metadata name="Designer">Tastir</metadata>\n' +
    `<resources>\n${main.join('')}</resources>\n` +
    `<build p:UUID="${uuid(0, 5)}">\n${build.join('')}</build>\n</model>\n`;
  const config =
    '<?xml version="1.0" encoding="UTF-8"?>\n<config>\n' + settings.join('') + plateXml.join('') + '</config>\n';
  const types =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>' +
    '<Default Extension="config" ContentType="text/xml"/>' +
    '</Types>\n';
  const rels =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>' +
    '</Relationships>\n';
  const modelRels =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    objectFiles
      .map((f, k) => `<Relationship Target="/${f.name}" Id="rel-${k + 1}" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>`)
      .join('') +
    '</Relationships>\n';
  const settingsFile = options.settings
    ? [
        {
          name: 'Metadata/project_settings.config',
          data: utf8(JSON.stringify(projectSettings(options.settings, options.colours ?? []), null, 4) + '\n'),
        },
      ]
    : [];
  return zip([
    { name: '[Content_Types].xml', data: utf8(types) },
    { name: '_rels/.rels', data: utf8(rels) },
    { name: '3D/3dmodel.model', data: utf8(model) },
    { name: '3D/_rels/3dmodel.model.rels', data: utf8(modelRels) },
    ...objectFiles,
    { name: 'Metadata/model_settings.config', data: utf8(config) },
    ...settingsFile,
  ]);
}

const NAMESPACES =
  'xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" ' +
  'xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" ' +
  'xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06"';

/** A UUID that is the same every time for the same object and use. */
function uuid(id: number, use: number): string {
  const hex = (n: number, w: number) => n.toString(16).padStart(w, '0').slice(-w);
  return `${hex(id, 8)}-${hex(use, 4)}-4000-8000-${hex(id * 7919 + use, 12)}`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
