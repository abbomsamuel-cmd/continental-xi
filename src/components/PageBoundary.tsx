"use client";

import { Component, type ReactNode } from "react";

/**
 * Reliability wrapper for a whole page. Catches render errors and shows a
 * friendly retry screen instead of a blank white page — important now that
 * the responsive lineups, translations and live match features are new.
 *
 * `title` / `body` / `retry` are passed in already-translated (the boundary
 * itself is a class component and can't call hooks).
 */
export class PageBoundary extends Component<
  { children: ReactNode; title: string; body: string; retry: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Surface it for debugging without crashing the app.
    console.error("[ContinentalXI] page error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex max-w-md flex-col items-center px-4 pb-24 pt-40 text-center">
          <div className="text-5xl" aria-hidden>⚠️</div>
          <h1 className="mt-4 font-display text-2xl font-extrabold">{this.props.title}</h1>
          <p className="mt-2 text-sm text-muted">{this.props.body}</p>
          <button
            className="btn btn-gold mt-6"
            onClick={() => {
              this.setState({ hasError: false });
              // A hard reload guarantees a clean rehydrate from the saved state.
              try { window.location.reload(); } catch { /* ignore */ }
            }}
          >
            ↻ {this.props.retry}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
