/**
 * Takes the printer, process and filament settings out of a project saved
 * by Bambu Studio (File → Save Project as) and writes them as the template
 * every Tastir project file carries, so Bambu Studio opens Tastir's files
 * with their plates and the A1's own settings.
 *
 *   node --import tsx tools/bambu-settings.mts <saved.3mf>
 *
 * The saved project may have any number of filaments: each setting kept
 * per filament is cut to the first filament's, and Tastir repeats it for
 * every colour it prints. Settings that only look per filament (the bed's
 * corners, the printers a process also suits) are kept whole.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [file] = process.argv.slice(2);
if (!file) throw new Error('Give the path of a project saved by Bambu Studio.');
const config = JSON.parse(
  execFileSync('unzip', ['-p', file, 'Metadata/project_settings.config'], { encoding: 'utf8', maxBuffer: 1 << 26 }),
) as Record<string, string | string[]>;

const filaments = (config.filament_settings_id as string[]).length;
if (config.printer_model !== 'Bambu Lab A1') throw new Error(`The project is for ${String(config.printer_model)}, not the A1.`);
// Lists the same length as the filaments (or a multiple) that are not per filament.
const WHOLE = new Set(['printable_area', 'head_wrap_detect_zone', 'upward_compatible_machine', 'flush_volumes_matrix']);
const perFilament: string[] = [];
const out: Record<string, string | string[]> = {};
for (const [key, value] of Object.entries(config)) {
  if (Array.isArray(value) && !WHOLE.has(key) && value.length >= filaments && value.length % filaments === 0) {
    perFilament.push(key);
    out[key] = value.slice(0, value.length / filaments);
  } else out[key] = value;
}
// Between two colours the flush is the largest the project had.
const flush = Math.max(...(config.flush_volumes_matrix as string[]).map(Number));
delete out.flush_volumes_matrix;

const template = {
  source: `Saved by Bambu Studio ${String(config.version)} for ${String(config.printer_settings_id)}, ${String(config.print_settings_id)}, ${(config.filament_settings_id as string[])[0]}.`,
  version: config.version,
  flush,
  perFilament: perFilament.sort(),
  config: out,
};
const target = new URL('../apps/player/src/make/bambu-a1.json', import.meta.url);
writeFileSync(target, JSON.stringify(template, null, 1) + '\n');
console.log(`${perFilament.length} settings per filament; written to ${target.pathname}`);
