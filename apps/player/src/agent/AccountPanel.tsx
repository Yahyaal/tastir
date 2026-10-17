import type { ConnectionStatus, ModelChoice } from '@tastir/agent-protocol';

/** Account and data-sharing UI, independent of the drawing workspace. */
export function AccountPanel({
  connection,
  models,
  modelId,
  profileId,
  polling,
  chooseProfile,
  connect,
  cancelSignIn,
  disconnect,
  stop,
  setModelId,
}: {
  connection: ConnectionStatus | undefined;
  models: ModelChoice[];
  modelId: string;
  profileId: string;
  polling: boolean;
  chooseProfile: (id: string) => Promise<void>;
  connect: (fresh?: boolean) => Promise<void>;
  cancelSignIn: () => Promise<void>;
  disconnect: () => Promise<void>;
  stop: () => void;
  setModelId: (id: string) => void;
}) {
  return (
    <>
      <p className="agent-connection">
        {connection?.connected
          ? connection.sharing
            ? 'Using ChatGPT plan'
            : 'Connected; ChatGPT plan permission is needed'
          : 'Connect your ChatGPT account'}
      </p>
      <div>
        {connection?.profiles.length ? (
          <label>
            Saved account{' '}
            <select
              value={profileId}
              onChange={(event) => {
                void chooseProfile(event.target.value);
              }}
            >
              {connection.profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="agent-actions">
          <button
            type="button"
            onClick={() => {
              void connect();
            }}
            disabled={polling}
          >
            {polling ? 'Waiting for ChatGPT sign-in…' : 'Continue with ChatGPT'}
          </button>
          {polling ? (
            <button
              type="button"
              onClick={() => {
                void cancelSignIn();
              }}
            >
              Cancel sign-in
            </button>
          ) : null}
          {connection?.profiles.length ? (
            <button
              type="button"
              onClick={() => {
                void connect(true);
              }}
              disabled={polling}
            >
              Add account
            </button>
          ) : null}
          {connection?.connected ? (
            <button
              type="button"
              onClick={() => {
                void disconnect();
              }}
            >
              Disconnect
            </button>
          ) : null}
        </div>
        <p className="agent-caption">
          Sending includes the current board image when available, page text,
          named geometry, saved pattern/design titles and your question to
          OpenAI. It uses your existing plan allowance.
        </p>
        <a
          href="https://chatgpt.com/settings/usage"
          target="_blank"
          rel="noreferrer"
        >
          Manage usage
        </a>
        {connection?.error ? <p role="alert">{connection.error}</p> : null}
        <label>
          Model{' '}
          <select
            value={modelId}
            onChange={(event) => {
              stop();
              setModelId(event.target.value);
            }}
            disabled={!models.length}
          >
            {!models.length ? (
              <option value="">Connect to load available models</option>
            ) : (
              models.map((choice) => (
                <option key={choice.slug} value={choice.slug}>
                  {choice.name}
                </option>
              ))
            )}
          </select>
        </label>
      </div>
    </>
  );
}
