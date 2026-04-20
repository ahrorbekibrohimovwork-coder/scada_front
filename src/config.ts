export const API_BASE_URL = 'https://scruffy-chaos-drift.ngrok-free.dev';

export const apiFetch = (path: string, options: RequestInit = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'ngrok-skip-browser-warning': '1',
      ...(options.headers || {}),
    },
  });
