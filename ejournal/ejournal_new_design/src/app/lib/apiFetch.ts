export const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://scruffy-chaos-drift.ngrok-free.dev';

export const apiFetch = (path: string, options: RequestInit = {}) =>
  fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'ngrok-skip-browser-warning': '1', ...(options.headers || {}) },
  });
