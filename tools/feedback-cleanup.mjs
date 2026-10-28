// Recovery for the scheduled cleanup. Never print the endpoint, secrets or report contents.
const origin = process.env.TASTIR_STUDIO_URL;
const secret = process.env.CRON_SECRET;
if (!origin || !secret || secret.length < 32)
  throw new Error(
    'Set TASTIR_STUDIO_URL and CRON_SECRET before running feedback cleanup.',
  );
const url = new URL(origin);
if (
  url.origin !== origin ||
  (url.protocol !== 'https:' &&
    !['127.0.0.1', 'localhost'].includes(url.hostname))
)
  throw new Error('Use the hosted HTTPS origin or a local test server.');
for (let batch = 0; batch < 3; batch++) {
  let result;
  try {
    const response = await fetch(new URL('/api/feedback/cleanup', url), {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(55000),
      redirect: 'error',
    });
    if (!response.ok) throw new Error('Refused');
    result = await response.json();
  } catch {
    throw new Error(
      'Cleanup could not finish. Check the server settings and retry; credentials are not shown.',
    );
  }
  console.log(
    JSON.stringify({
      reports: result.reports,
      pending: result.pending,
      failed: result.failed,
      more: result.more,
    }),
  );
  if (result.failed) {
    process.exitCode = 1;
    break;
  }
  if (!result.more) break;
  if (batch === 2)
    console.log(
      'More work remains. Run the bounded cleanup again to continue.',
    );
}
