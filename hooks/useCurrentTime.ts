"use client";

import { useSyncExternalStore } from "react";

// Cached client timestamp updated only when interval fires
let cachedTimestamp = typeof window !== "undefined" ? Date.now() : 1792918800000;

function subscribe(callback: () => void) {
  const interval = setInterval(() => {
    cachedTimestamp = Date.now();
    callback();
  }, 30000);
  return () => clearInterval(interval);
}

function getSnapshot(): number {
  return cachedTimestamp;
}

// Fixed stable timestamp for Next.js prerendering
const SERVER_STABLE_TIME = 1792918800000; // October 25, 2026

function getServerSnapshot(): number {
  return SERVER_STABLE_TIME;
}

export function useCurrentTimestamp(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

