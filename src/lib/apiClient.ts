import { API_BASE_URL } from '@/config/api';
import localBackend from './localBackend';

function timeoutPromise<T>(ms: number, p: Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms);
    p.then((res) => {
      clearTimeout(id);
      resolve(res);
    }).catch(err => {
      clearTimeout(id);
      reject(err);
    });
  });
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  // If developer or user forces local backend, short-circuit
  if (localStorage.getItem('forceLocalBackend') === '1') {
    return localBackend.handleLocalRequest(path, options);
  }

  // Inject user ID for active session tracking
  const storeRaw = localStorage.getItem('freshfity-store');
  let userId = '';
  if (storeRaw) {
    try {
       const parsed = JSON.parse(storeRaw);
       userId = parsed?.state?.currentUser?.id || '';
    } catch(e) {}
  }

  const mergedOptions = {
    ...options,
    headers: {
      ...options?.headers,
      ...(userId ? { 'x-user-id': userId } : {})
    }
  };

  const base = API_BASE_URL || '';
  const url = base + path;

  // Try network with a short timeout so sleeping Railway doesn't block
  try {
    const res = await timeoutPromise<Response>(3000, fetch(url, mergedOptions));
    if (!res.ok) return res;
    return res;
  } catch (err) {
    console.warn('Network fetch failed or timed out, using local backend for', path, err?.message);
    return localBackend.handleLocalRequest(path, options);
  }
}

export default apiFetch;
