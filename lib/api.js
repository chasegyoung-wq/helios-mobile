// ============================================================
// HELIOS MOBILE — API CLIENT
// Handles auth token storage via SecureStore and API calls
// ============================================================

import * as SecureStore from 'expo-secure-store';

// ── Change this to your local IP when testing on device ──
// For device testing: use your Mac's local IP (e.g. 192.168.1.x)
// For simulator: use localhost
const API_BASE = 'http://192.168.4.71:4000/api';

let accessToken = null;

export async function getAccessToken() {
  if (accessToken) return accessToken;
  accessToken = await SecureStore.getItemAsync('helios_access_token');
  return accessToken;
}

export async function setAccessToken(token) {
  accessToken = token;
  if (token) {
    await SecureStore.setItemAsync('helios_access_token', token);
  } else {
    await SecureStore.deleteItemAsync('helios_access_token');
  }
}

export async function setRefreshToken(token) {
  if (token) {
    await SecureStore.setItemAsync('helios_refresh_token', token);
  } else {
    await SecureStore.deleteItemAsync('helios_refresh_token');
  }
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync('helios_refresh_token');
}

// ── Core request function ─────────────────────────────────────
async function request(method, path, body = null, retry = true) {
  const token = await getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Token expired — try refresh
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request(method, path, body, false);
    throw new Error('SESSION_EXPIRED');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw Object.assign(new Error(err.error || 'Request failed'), { status: response.status });
  }

  return response.json();
}

// ── Refresh token ─────────────────────────────────────────────
async function refreshAccessToken() {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    await setAccessToken(data.accessToken);
    if (data.refreshToken) await setRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ── Public API ────────────────────────────────────────────────
export const api = {
  get:    (path) => request('GET', path),
  post:   (path, body) => request('POST', path, body),
  put:    (path, body) => request('PUT', path, body),
  patch:  (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),

  auth: {
    login: (email, password) => request('POST', '/auth/login', { email, password }, false),
    logout: () => request('POST', '/auth/logout', {}, false),
    me: () => request('GET', '/auth/me'),
  },
};

export { API_BASE };
