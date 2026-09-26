import { useSyncExternalStore } from "react";

export type Theme = "system" | "light" | "dark";
export const themeKey = "beneath-the-pine.theme";
export const validTheme = (value: unknown): Theme => value === "light" || value === "dark" ? value : "system";
export const resolveTheme = (value: Theme, dark: boolean) => value === "system" ? (dark ? "dark" : "light") : value;

let preference: Theme = "system";
const listeners = new Set<() => void>();
let initialized = false;

function apply() {
  const resolved = resolveTheme(preference, matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#202521" : "#FAFAF7");
  listeners.forEach(listener => listener());
}

export function initializeTheme() {
  if (initialized) return;
  initialized = true;
  try {
    preference = validTheme(localStorage.getItem(themeKey));
  } catch {
    // Storage is optional.
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", apply);
  window.addEventListener("storage", event => {
    if (event.key === themeKey || event.key === null) {
      preference = validTheme(event.newValue);
      apply();
    }
  });
  apply();
}

export function setTheme(value: Theme) {
  preference = value;
  try {
    localStorage.setItem(themeKey, value);
  } catch {
    // Keep the in-memory choice.
  }
  apply();
}

export function useTheme() {
  return useSyncExternalStore(listener => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, () => preference);
}
