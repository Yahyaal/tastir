import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ChatMessage } from './conversation';
import { AssistantIcon } from './AssistantIcon';

/** Small safe text formatter; model output is always React text, never HTML. */
function MessageText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i}>
          {paragraph
            .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
            .map((part, j) =>
              part.startsWith('**') ? (
                <strong key={j}>{part.slice(2, -2)}</strong>
              ) : part.startsWith('`') ? (
                <code key={j}>{part.slice(1, -1)}</code>
              ) : (
                part
              ),
            )}
        </p>
      ))}
    </>
  );
}

export function ChatPanel({
  messages,
  prompt,
  setPrompt,
  activity,
  error,
  ready,
  send,
  stop,
  newChat,
  account,
  tools,
  image,
  context,
  workspace,
  onClose,
}: {
  onClose?: () => void;
  messages: ChatMessage[];
  prompt: string;
  setPrompt: (text: string) => void;
  activity: string;
  error: string;
  ready: boolean;
  send: () => Promise<void>;
  stop: () => void;
  newChat: () => Promise<void>;
  account: ReactNode;
  tools: ReactNode;
  image: string;
  context: string;
  workspace: boolean;
}) {
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const follow = useRef(true);
  const [resetting, setResetting] = useState(false);
  useEffect(() => {
    if (follow.current && log.current)
      log.current.scrollTop = log.current.scrollHeight;
  }, [messages, activity]);
  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, []);
  const lastAnswer = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant');
  const errorInReply =
    lastAnswer?.state === 'error' && lastAnswer.text.includes(error);
  return (
    <aside className="agent-panel agent-chat" aria-label="Assistant">
      <header className="agent-chat-head">
        <span className="agent-avatar">
          <AssistantIcon />
        </span>
        <div>
          <h2>Assistant</h2>
          <p className="agent-caption">Your pattern companion</p>
        </div>
        <button
          className="quiet agent-new-chat"
          type="button"
          title="New conversation"
          aria-label="New conversation"
          disabled={resetting || !!activity || !messages.length}
          onClick={async () => {
            setResetting(true);
            try {
              await newChat();
              follow.current = true;
              input.current?.focus();
            } finally {
              setResetting(false);
            }
          }}
        >
          ＋
        </button>
        {onClose ? (
          <button
            className="quiet agent-close"
            type="button"
            aria-label="Close assistant panel"
            title="Close assistant"
            onClick={onClose}
          >
            ×
          </button>
        ) : null}
      </header>
      <details className="agent-chat-settings" open={!ready}>
        <summary>Connection and model</summary>
        {account}
      </details>
      <p className="agent-context" title={context}>
        <span aria-hidden="true">◉</span> {context}
      </p>
      <div
        className="agent-chat-log"
        ref={log}
        tabIndex={0}
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        aria-relevant="additions text"
        onScroll={() => {
          const el = log.current;
          if (el)
            follow.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
      >
        {!messages.length ? (
          <div className="agent-chat-empty">
            <AssistantIcon />
            <h3>What shall we make?</h3>
            <p>
              I can explain patterns, find a design, point things out, draw and
              color. Tell me what you have in mind.
            </p>
            <div className="agent-suggestions">
              {[
                'What can I do here?',
                'Help me draw a new pattern',
                'Explain this pattern',
              ].map((text) => (
                <button
                  type="button"
                  className="secondary"
                  key={text}
                  onClick={() => {
                    setPrompt(text);
                    input.current?.focus();
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {messages.map((m) => (
          <article
            key={m.id}
            className={`agent-message agent-message-${m.role}`}
            aria-label={m.role === 'user' ? 'You' : 'Assistant reply'}
            aria-busy={m.state === 'pending'}
          >
            <span className="agent-message-author">
              {m.role === 'user' ? 'You' : 'Assistant'}
            </span>
            <div
              className={
                m.id === lastAnswer?.id ? 'agent-answer' : 'agent-message-text'
              }
            >
              <MessageText text={m.text} />
            </div>
            {m.actions?.length ? (
              <details className="agent-action-receipts">
                <summary>
                  {m.actions.length}{' '}
                  {m.actions.length === 1 ? 'action' : 'actions'}
                </summary>
                <ul>
                  {m.actions.map((a, index) => (
                    <li key={index}>
                      {a.ok ? '✓' : '○'} {a.label}
                      {!a.ok ? <p>{a.message}</p> : null}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            {m.state === 'pending' ? (
              <p className="agent-caption">{activity || 'Thinking…'}</p>
            ) : m.state === 'stopped' ? (
              <p className="agent-caption">
                Stopped. Changes already made are kept; you can ask me to undo
                them.
              </p>
            ) : null}
          </article>
        ))}
      </div>
      <div className="agent-chat-bottom">
        {error && !errorInReply ? (
          <p className="agent-error" role="alert">
            {error}
          </p>
        ) : null}
        <p className="agent-activity" role="status">
          {activity || (resetting ? 'Starting a new conversation…' : '')}
        </p>
        {error ? (
          <button
            type="button"
            className="quiet"
            onClick={() => {
              const last = [...messages]
                .reverse()
                .find((m) => m.role === 'user');
              if (last) setPrompt(last.text);
              input.current?.focus();
            }}
          >
            Edit and retry
          </button>
        ) : null}
        {error &&
        lastAnswer?.state === 'error' &&
        ['usage_limit', 'rate_limited'].includes(lastAnswer.errorCode ?? '') ? (
          <a
            className="agent-usage-link"
            href="https://chatgpt.com/settings/usage"
            target="_blank"
            rel="noreferrer"
          >
            Manage usage ↗
          </a>
        ) : null}
        {tools}
        <form
          className="agent-composer"
          onSubmit={(e) => {
            e.preventDefault();
            follow.current = true;
            void send();
          }}
        >
          <label className="visually-hidden" htmlFor="assistant-message">
            Your request
          </label>
          <textarea
            ref={input}
            id="assistant-message"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask or describe a pattern…"
            maxLength={8000}
            rows={2}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                !window.matchMedia('(pointer: coarse)').matches
              ) {
                e.preventDefault();
                if (ready && prompt.trim() && !activity && !resetting) {
                  follow.current = true;
                  void send();
                }
              }
            }}
          />
          {activity ? (
            <button
              type="button"
              className="agent-send"
              onClick={stop}
              aria-label="Stop"
              title="Stop"
            >
              ■
            </button>
          ) : (
            <button
              type="submit"
              className="agent-send"
              disabled={!ready || !prompt.trim() || resetting}
              aria-label="Send current view"
              title="Send message"
            >
              ↑
            </button>
          )}
        </form>
        <p className="agent-caption agent-sharing">
          Sends your message, current view and saved-work titles to OpenAI. Uses
          your ChatGPT plan.
        </p>
        {image ? (
          <details className="agent-image-details">
            <summary>View shared with the assistant</summary>
            <img
              className="agent-sent-image"
              src={image}
              alt="The board image sent with the last assistant request"
            />
          </details>
        ) : null}
        {workspace ? (
          <p className="agent-caption">
            Drawing, coloring and history use the controls on this board.
          </p>
        ) : (
          <p className="agent-caption">
            <a href="#/agent">assistant workspace</a>
          </p>
        )}
      </div>
    </aside>
  );
}
