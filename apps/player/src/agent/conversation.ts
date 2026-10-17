import { useRef, useState } from 'react';
import { AgentClient } from './client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  state: 'pending' | 'complete' | 'stopped' | 'error';
  errorCode?: string;
  actions?: { label: string; ok: boolean; message: string }[];
}

/** In-memory, text-only transcript. Never store board images or account tokens. */
export function useConversation() {
  const [client] = useState(() => new AgentClient());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const active = useRef<string | null>(null);
  const begin = (text: string) => {
    const id = crypto.randomUUID();
    active.current = id;
    setMessages((before) => [
      ...before.slice(-98),
      { id: crypto.randomUUID(), role: 'user', text, state: 'complete' },
      { id, role: 'assistant', text: '', state: 'pending' },
    ]);
  };
  const update = (
    text: string,
    state: ChatMessage['state'] = 'complete',
    errorCode?: string,
  ) => {
    const id = active.current;
    if (!id) return;
    setMessages((before) =>
      before.map((m) =>
        m.id === id
          ? { ...m, text: text.slice(0, 40000), state, errorCode }
          : m,
      ),
    );
    if (state !== 'pending') active.current = null;
  };
  const interrupt = () => {
    const id = active.current;
    active.current = null;
    if (id)
      setMessages((before) =>
        before.map((m) =>
          m.id === id && m.state === 'pending' ? { ...m, state: 'stopped' } : m,
        ),
      );
  };
  const clear = () => {
    active.current = null;
    setMessages([]);
  };
  const recordActions = (actions: NonNullable<ChatMessage['actions']>) => {
    const id = active.current;
    if (id)
      setMessages((before) =>
        before.map((m) =>
          m.id === id
            ? { ...m, actions: [...(m.actions ?? []), ...actions].slice(-32) }
            : m,
        ),
      );
  };
  return { client, messages, begin, update, interrupt, clear, recordActions };
}
export type Conversation = ReturnType<typeof useConversation>;
