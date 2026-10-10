import { Component, type ReactNode } from 'react';

/** A failed drawing must leave a way back without deleting saved work. */
export class RecoveryBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="player">
        <section className="notice" role="alert">
          <h1>This pattern could not be opened</h1>
          <p>
            Try another pattern or reload the page. Your saved work has not been
            deleted.
          </p>
          <a
            className="button"
            href="#/"
            onClick={() => {
              window.location.hash = '#/';
              this.setState({ failed: false });
            }}
          >
            All patterns
          </a>{' '}
          <button type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </section>
      </main>
    );
  }
}
