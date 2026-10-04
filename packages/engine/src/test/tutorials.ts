import { readdirSync, readFileSync } from 'node:fs';
import { parseTutorial, type Tutorial } from '@tastir/schema';

/** The repo's tutorials/ folder. */
export const TUTORIALS_DIR = new URL('../../../../tutorials/', import.meta.url);

export const tutorialFiles = (): string[] =>
  readdirSync(TUTORIALS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

export const readTutorialJson = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(file, TUTORIALS_DIR), 'utf8'));

export const loadTutorial = (file: string): Tutorial =>
  parseTutorial(readTutorialJson(file));

export const starAndCross = (): Tutorial =>
  loadTutorial('eight-fold-star-and-cross.json');
