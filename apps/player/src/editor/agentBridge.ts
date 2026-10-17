import type { Dispatch, SetStateAction } from 'react';
import type { Snapshot, ToolCall } from '@tastir/agent-protocol';
import type { Draft } from './document';
import type { DraftHistory } from './history';

/** Shared projects delegate to their authoritative service, including history. */
export interface SharedEditorAgent {
  readonly route: string;
  readonly revision: number;
  readonly history: Snapshot['history'];
  apply(
    call: ToolCall,
    snapshot: Snapshot,
    requestId: string,
    signal?: AbortSignal,
  ): Promise<string>;
}

/** Passive registration only: production editor code never imports agent tools. */
interface PageEditor {
  id: string;
  history: DraftHistory;
  setHistory: Dispatch<SetStateAction<DraftHistory>>;
  committed: (draft: Draft) => void;
  autoSaved: boolean;
  shared?: SharedEditorAgent;
}
let current: PageEditor | undefined;
export function registerPageEditor(value: PageEditor) {
  current = value;
  return () => {
    if (current === value) current = undefined;
  };
}

export const getPageEditor = () => current;
