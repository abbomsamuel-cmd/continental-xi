"use client";

import { useSyncExternalStore } from "react";

/**
 * Global motion & effects level — the performance backbone for phones.
 *
 * The user setting ("auto" | "full" | "reduced" | "off") persists in
 * localStorage. The EFFECTIVE level resolves to:
 *   off      prefers-reduced-motion, or the manual Off setting
 *   reduced  viewports under 768px (mobile performance mode), or manual
 *   full     everything else
 *
 * The level is stamped on <html data-fx="..."> so CSS can strip heavy
 * backdrop-filters, shines and infinite animations globally, and components
 * read it via useFxLevel()/fxLevel() to scale particle counts.
 */

export type FxSetting = "auto" | "full" | "reduced" | "off";
export type FxLevel = "full" | "reduced" | "off";

const STORAGE_KEY = "cxi-motion";

let setting: FxSetting = "auto";
let level: FxLevel = "full";
let started = false;
const listeners = new Set<() => void>();

function computeLevel(): FxLevel {
  if (typeof window === "undefined") return "full";
  if (setting === "off") return "off";
  if (setting === "reduced") return "reduced";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "off";
  if (setting === "full") return "full";
  // auto: mobile performance mode below 768px
  return window.matchMedia("(max-width: 767px)").matches ? "reduced" : "full";
}

function apply() {
  const next = computeLevel();
  if (next !== level) {
    level = next;
    listeners.forEach((l) => l());
  }
  if (typeof document !== "undefined") document.documentElement.dataset.fx = level;
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as FxSetting | null;
    if (stored === "auto" || stored === "full" || stored === "reduced" || stored === "off") setting = stored;
  } catch { /* private mode */ }
  for (const q of ["(prefers-reduced-motion: reduce)", "(max-width: 767px)"]) {
    const mq = window.matchMedia(q);
    if (mq.addEventListener) mq.addEventListener("change", apply);
  }
  apply();
}

export function getFxSetting(): FxSetting {
  start();
  return setting;
}

export function setFxSetting(next: FxSetting) {
  setting = next;
  try { localStorage.setItem(STORAGE_KEY, next); } catch { /* private mode */ }
  apply();
}

/** Effective level right now — for imperative reads (particle counts etc.). */
export function fxLevel(): FxLevel {
  start();
  return level;
}

function subscribe(cb: () => void): () => void {
  start();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Reactive effective level. Server snapshot is "full" (matches static HTML;
 *  the stamp + any count reduction land in the same first client paint). */
export function useFxLevel(): FxLevel {
  return useSyncExternalStore(subscribe, () => { start(); return level; }, () => "full");
}

/** Scale a particle/flash count by the effective level. */
export function fxCount(full: number): number {
  const l = fxLevel();
  return l === "off" ? 0 : l === "reduced" ? Math.ceil(full / 3) : full;
}
