import { useEffect, useRef, useState } from 'react';
import {
  FEEDBACK_LIMITS,
  FeedbackSnapshotShape,
  feedbackCanonicalJson,
  utf8Size,
} from '@tastir/schema';
import {
  feedbackCall,
  feedbackDownload,
  FeedbackFailure,
  type Capture,
} from './client';
import './feedback.css';

type Widget = {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  remove(id: string): void;
};
declare global {
  interface Window {
    turnstile?: Widget;
  }
}
let loading: Promise<void> | undefined;
function loadVerification() {
  if (window.turnstile) return Promise.resolve();
  if (!loading)
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      const timer = window.setTimeout(() => {
        script.remove();
        loading = undefined;
        reject(
          new Error(
            'Verification could not load. Retry, or keep your message for later.',
          ),
        );
      }, 10000);
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        loading = undefined;
        reject(
          new Error(
            'Verification could not load. Retry, or keep your message for later.',
          ),
        );
      };
      document.head.append(script);
    });
  return loading;
}
type Config = {
  enabled: boolean;
  attachments: boolean;
  siteKey: string;
  contact: string;
};

/** Lives outside the routed page, so navigation and closing never erase an unsent draft. */
export function FeedbackHost() {
  const [capture, setCapture] = useState<Capture>();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const open = (event: Event) => {
      setCapture(
        (existing) => existing ?? (event as CustomEvent<Capture>).detail,
      );
      setVisible(true);
    };
    window.addEventListener('tastir-feedback', open);
    return () => window.removeEventListener('tastir-feedback', open);
  }, []);
  return capture ? (
    <FeedbackForm
      capture={capture}
      visible={visible}
      close={() => setVisible(false)}
      discard={() => {
        setCapture(undefined);
        setVisible(false);
      }}
    />
  ) : null;
}

function FeedbackForm({
  capture,
  visible,
  close,
  discard,
}: {
  capture: Capture;
  visible: boolean;
  close: () => void;
  discard: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const widget = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<Config>();
  const [context, setContext] = useState(capture.context);
  const [category, setCategory] = useState('problem');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [whole, setWhole] = useState(false);
  const [include, setInclude] = useState(false);
  const [image, setImage] = useState<string>();
  const [token, setToken] = useState('');
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const sent = useRef<Record<string, unknown> | undefined>(undefined);
  const sentAt = useRef(0);
  const pending = !!sent.current;
  const validSnapshot = capture.snapshot
    ? FeedbackSnapshotShape.safeParse(capture.snapshot)
    : undefined;
  const attachment = validSnapshot?.success ? validSnapshot.data : undefined;
  useEffect(() => {
    if (visible) dialog.current?.showModal();
    else dialog.current?.close();
  }, [visible]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(
      () => setCooldown((n) => Math.max(0, n - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => {
    void capture.image?.then((value) => setImage(value));
  }, [capture]);
  useEffect(() => {
    let active = true;
    if (capture.tutorial && crypto.subtle)
      void crypto.subtle
        .digest(
          'SHA-256',
          new TextEncoder().encode(feedbackCanonicalJson(capture.tutorial)),
        )
        .then((hash) => {
          if (active)
            setContext({
              ...capture.context,
              tutorialHash: [...new Uint8Array(hash)]
                .map((b) => b.toString(16).padStart(2, '0'))
                .join(''),
            });
        })
        .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [capture]);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    void feedbackCall<Config>('feedback/config')
      .then((value) => {
        if (active) {
          setConfig(value);
          if (value.enabled)
            void feedbackCall('feedback/session', {}).catch(() => undefined);
        }
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [visible, retry]);
  useEffect(() => {
    if (!visible || !config?.enabled || !config.siteKey || !widget.current)
      return;
    let active = true,
      id: string | undefined;
    setToken('');
    void loadVerification()
      .then(() => {
        if (!active || !widget.current || !window.turnstile) return;
        id = window.turnstile.render(widget.current, {
          sitekey: config.siteKey,
          action: 'feedback_submit',
          appearance: 'interaction-only',
          callback: (value: string) => {
            if (active) {
              setToken(value);
              setVerificationError('');
            }
          },
          'expired-callback': () => {
            if (active) setToken('');
          },
          'error-callback': () => {
            if (active) {
              setToken('');
              setVerificationError(
                'Verification could not finish. Retry it; your message is still here.',
              );
            }
          },
        });
      })
      .catch((e: Error) => {
        if (active) setVerificationError(e.message);
      });
    return () => {
      active = false;
      if (id) window.turnstile?.remove(id);
    };
  }, [visible, config?.enabled, config?.siteKey, retry]);
  function unsent() {
    return {
      sent: false,
      category,
      message,
      context,
      ...(include && attachment ? { snapshot: attachment, image } : {}),
    };
  }
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (busy || cooldown) return;
    if (sent.current && Date.now() - sentAt.current >= 86400000) {
      setError(
        'This send reference has expired. Download your draft and check with the owner before starting a new report; sending it again could create a duplicate.',
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (!sent.current) {
        sentAt.current = Date.now();
        const secret = [...crypto.getRandomValues(new Uint8Array(32))]
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        sent.current = {
          id: crypto.randomUUID(),
          retrySecret: secret,
          category,
          message: message.trim(),
          email,
          context: whole
            ? {
                ...context,
                label: 'Whole pattern',
                stepIds: [],
                instruction: '',
              }
            : context,
          ...(include && attachment
            ? { snapshot: attachment, ...(image ? { image } : {}) }
            : {}),
        };
      }
      const body = { ...sent.current, token: token || 'retry-receipt' };
      if (utf8Size(JSON.stringify(body)) > FEEDBACK_LIMITS.body)
        throw new FeedbackFailure(
          'This drawing is too large. Remove it to send your message.',
          413,
          'size',
        );
      const value = await feedbackCall<{ receipt: string }>('feedback', body);
      setReceipt(value.receipt);
      sent.current = undefined;
    } catch (e) {
      const failure =
        e instanceof FeedbackFailure
          ? e
          : new FeedbackFailure('Sending could not finish. Please retry.', 0);
      setError(failure.message);
      setCooldown(Math.min(failure.retryAfter, 600));
      // Preserve the exact send after an uncertain response. A new token is requested for known failures.
      if (
        failure.status >= 400 &&
        !['pending', 'expired', 'conflict'].includes(failure.code) &&
        failure.status !== 503
      )
        sent.current = undefined;
      if (
        failure.status === 503 &&
        ['paused', 'attachments', 'capacity'].includes(failure.code)
      )
        sent.current = undefined;
      setRetry((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="feedback-dialog"
      aria-labelledby="feedback-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="feedback-heading">
        <h2 id="feedback-title">
          {receipt ? 'Feedback sent' : 'Report an issue or leave feedback'}
        </h2>
        <button
          type="button"
          className="secondary"
          onClick={receipt ? discard : close}
          aria-label="Close feedback"
        >
          Close
        </button>
      </div>
      {receipt ? (
        <>
          <p role="status">Thanks — your feedback was sent.</p>
          <p>
            Receipt: <code>{receipt}</code>
          </p>
          <p>The owner can review it. A reply or fix is not guaranteed.</p>
        </>
      ) : (
        <form onSubmit={(e) => void send(e)}>
          <p>
            About: <strong>{capture.context.title || 'This pattern'}</strong> ·{' '}
            {capture.context.label}
          </p>
          <label>
            <input
              type="checkbox"
              checked={whole}
              disabled={pending || busy}
              onChange={(e) => setWhole(e.target.checked)}
            />{' '}
            About the whole pattern
          </label>
          <fieldset disabled={pending || busy}>
            <legend>What kind of feedback?</legend>
            <div className="feedback-options">
              {(
                [
                  ['problem', 'Something looks wrong'],
                  ['stuck', "I'm stuck"],
                  ['comment', 'Comment or suggestion'],
                ] as const
              ).map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="feedback-kind"
                    value={value}
                    checked={category === value}
                    onChange={() => setCategory(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <label htmlFor="feedback-message">
            What happened, or what would you like to tell us?
          </label>
          <textarea
            id="feedback-message"
            value={message}
            required
            maxLength={4000}
            rows={5}
            disabled={pending || busy}
            onChange={(e) => setMessage(e.target.value)}
          />
          {message.length > 3500 ? (
            <p>{4000 - message.length} characters left</p>
          ) : null}
          <label htmlFor="feedback-email">
            Email, if you would like a reply (optional)
          </label>
          <input
            id="feedback-email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            disabled={pending || busy}
            onChange={(e) => setEmail(e.target.value)}
          />
          {attachment ? (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={include}
                  disabled={!config?.attachments || pending || busy}
                  aria-describedby={
                    !config?.attachments
                      ? 'feedback-attachment-unavailable'
                      : undefined
                  }
                  onChange={(e) => setInclude(e.target.checked)}
                />{' '}
                Include my current drawing and editable drawing data
              </label>
              {!config?.attachments ? (
                <p
                  id="feedback-attachment-unavailable"
                  className="feedback-muted"
                >
                  Attaching your drawing isn't available right now. You can
                  still send your message.
                </p>
              ) : null}
            </>
          ) : capture.snapshot ? (
            <p>
              This drawing is too large to attach. You can still send your
              message.
            </p>
          ) : null}
          {include ? (
            <details open>
              <summary>Drawing attachment preview</summary>
              {image ? (
                <>
                  <img src={image} alt="Your board at the reported step" />
                  <button
                    type="button"
                    className="secondary"
                    disabled={pending || busy}
                    onClick={() => setImage(undefined)}
                  >
                    Remove board image and keep drawing data
                  </button>
                </>
              ) : (
                <p>
                  A board image is unavailable; the editable drawing will be
                  included.
                </p>
              )}
            </details>
          ) : null}
          <p className="feedback-muted">
            We'll include the pattern, the instruction shown, and basic app
            details. Your report is private to the owner and may be shared with
            an AI tool to investigate. Your email is excluded from AI exports.
          </p>
          <details>
            <summary>Details included with this report</summary>
            <pre>{JSON.stringify(capture.context, null, 2)}</pre>
          </details>
          <details>
            <summary>Privacy and deletion</summary>
            <p>
              Feedback is used to improve Tastir. Reports are kept for up to a
              year; optional email and drawing evidence for 90 days. Spam is
              kept for 30 days. An investigation may need longer retention. The
              owner can share selected evidence with an external AI tool;
              downloaded copies cannot be recalled. Cloudflare Turnstile checks
              submissions for bots.
            </p>
            <p>
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noreferrer"
              >
                Cloudflare privacy policy
              </a>{' '}
              ·{' '}
              <a
                href="https://www.cloudflare.com/turnstile-privacy-policy/"
                target="_blank"
                rel="noreferrer"
              >
                Turnstile privacy information
              </a>
            </p>
            {config?.contact ? (
              <p>
                To request deletion, contact{' '}
                <a href={`mailto:${config.contact}`}>{config.contact}</a> with
                your receipt reference. The owner reviews deletion requests.
              </p>
            ) : null}
          </details>
          <div ref={widget} />
          {!config?.enabled ? (
            <p role="status">
              Feedback is not accepting reports here right now. You can copy or
              download your message.
            </p>
          ) : !token ? (
            <p role="status">Waiting for the quick verification…</p>
          ) : null}
          {error ? <p role="alert">{error}</p> : null}
          {verificationError ? <p role="alert">{verificationError}</p> : null}
          {pending ? (
            <p>
              Retry checks the same send. Your message is held unchanged until
              it is confirmed.
            </p>
          ) : null}
          <div className="feedback-actions">
            <button
              type="submit"
              disabled={
                busy ||
                cooldown > 0 ||
                !config?.enabled ||
                (!token && !pending) ||
                !message.trim()
              }
            >
              {busy
                ? 'Sending…'
                : cooldown
                  ? `Try again in ${cooldown}s`
                  : pending
                    ? 'Retry same send'
                    : 'Send feedback'}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => setRetry((n) => n + 1)}
            >
              Retry verification
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                void navigator.clipboard
                  .writeText(JSON.stringify(unsent(), null, 2))
                  .then(
                    () => setError('Your unsent report was copied.'),
                    () =>
                      setError(
                        'Copy is unavailable. Download the unsent report instead.',
                      ),
                  );
              }}
            >
              Copy text
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                feedbackDownload(unsent(), 'tastir-unsent-feedback.json')
              }
            >
              Download unsent report
            </button>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => {
                if (
                  !pending ||
                  window.confirm(
                    'This send has not been confirmed. Discarding the draft will stop retrying it; a later new report may duplicate an earlier send. Download the unsent report first if you want to keep it.',
                  )
                )
                  discard();
              }}
            >
              Discard draft
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
