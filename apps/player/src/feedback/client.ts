import type { FeedbackContext, FeedbackSnapshot } from '@tastir/schema';

export const FEEDBACK_AVAILABLE =
  import.meta.env.DEV || import.meta.env['VITE_TASTIR_STUDIO'] === 'hosted';
export type Capture = {
  context: FeedbackContext;
  tutorial?: unknown;
  snapshot?: FeedbackSnapshot;
  image?: Promise<string | undefined>;
};
export interface ReportLine {
  id: string;
  created: string;
  category: string;
  message: string;
  context: FeedbackContext;
  status: string;
  moderation: string;
  priority: string;
  group: string;
  version: number;
}
export interface Report extends ReportLine {
  snapshot: FeedbackSnapshot | null;
  image: boolean;
  email: string;
  expires: string;
  evidenceExpires: string;
  events: {
    id: string;
    author: string;
    at: string;
    kind: string;
    detail: Record<string, unknown>;
  }[];
}
export class FeedbackFailure extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = '',
    readonly retryAfter = 0,
  ) {
    super(message);
  }
}
export async function feedbackCall<T>(
  path: string,
  data?: unknown,
  csrf?: string,
  method?: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, {
      method: method ?? (data === undefined ? 'GET' : 'POST'),
      credentials: 'same-origin',
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
      headers: {
        'Content-Type': 'application/json',
        ...(csrf ? { 'X-Tastir-CSRF': csrf } : {}),
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
  } catch {
    throw new FeedbackFailure(
      'The send could not be confirmed. Your message is still here. Retry to check the same send.',
      0,
      'uncertain',
    );
  }
  if (!response.headers.get('content-type')?.includes('application/json'))
    throw new FeedbackFailure(
      'Feedback is not available on this site yet. You can copy or download your message.',
      503,
      'unavailable',
    );
  const value = await response.json();
  if (!response.ok)
    throw new FeedbackFailure(
      value.error ?? 'Feedback could not finish. Please retry.',
      response.status,
      value.code,
      Number(response.headers.get('Retry-After')) || 0,
    );
  return value;
}
export function feedbackDownload(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function openFeedback(capture: Capture) {
  window.dispatchEvent(new CustomEvent('tastir-feedback', { detail: capture }));
}

export function basicFeedbackContext(
  pattern: string,
  title: string,
  mode: FeedbackContext['mode'],
): FeedbackContext {
  // Never collect raw URLs, share links, user-agent strings, or browser storage.
  const ua = navigator.userAgent;
  const browser = /Firefox\//.test(ua)
    ? 'Firefox'
    : /Edg\//.test(ua)
      ? 'Edge'
      : /Chrome\//.test(ua)
        ? 'Chromium'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Other';
  const os = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad/.test(ua)
      ? 'iOS'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Macintosh/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Other';
  return {
    version: 1,
    pattern: pattern.slice(0, 160),
    title: title.slice(0, 240),
    mode,
    stage: mode,
    stepIds: [],
    label: 'Whole pattern',
    instruction: '',
    build: import.meta.env['VITE_TASTIR_BUILD_ID'] ?? 'development',
    browser: `${browser} / ${os}`,
    viewport: [
      Math.min(20000, window.innerWidth),
      Math.min(20000, window.innerHeight),
    ],
    input: window.matchMedia?.('(pointer: coarse)')?.matches
      ? 'touch'
      : 'pointer',
  };
}
