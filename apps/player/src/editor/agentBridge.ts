import type { Dispatch, SetStateAction } from 'react';
import type { Draft } from './document';
import type { DraftHistory } from './history';

/** Passive registration only: production editor code never imports agent tools. */
interface PageEditor {
  id: string;
  history: DraftHistory;
  setHistory: Dispatch<SetStateAction<DraftHistory>>;
  committed: (draft: Draft) => void;
  autoSaved: boolean;
}
let current: PageEditor | undefined;
export function registerPageEditor(value: PageEditor) {
  current = value;
  return () => {
    if (current === value) current = undefined;
  };
}

export const getPageEditor = () => current;
