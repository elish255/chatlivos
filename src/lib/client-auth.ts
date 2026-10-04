export type Profile = {
  id: string;
  email: string;
  full_name: string;
  username: string;
  phone: string;
  country: string;
  is_active: boolean;
  balance: number;
};

const ACCESS_KEY = "chatlivos_access_token";
const REFRESH_KEY = "chatlivos_refresh_token";

export function saveSession(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export async function apiPost<T = any>(body: Record<string, unknown>, auth = false): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const token = getAccessToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch("/api", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message || "Kuna tatizo. Jaribu tena.");
  }
  return data as T;
}

export async function getMe() {
  const token = getAccessToken();
  if (!token) return null;

  const response = await fetch("/api", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));

  if (response.ok && data?.ok) return data;

  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) {
    clearSession();
    return null;
  }

  try {
    const refreshed = await apiPost<any>({
      action: "refresh",
      refreshToken,
    });
    saveSession(refreshed.accessToken, refreshed.refreshToken);
    return {
      ok: true,
      profile: refreshed.profile,
      user: { id: refreshed.profile?.id, email: refreshed.profile?.email },
    };
  } catch {
    clearSession();
    return null;
  }
}

export function normalizeLocalTanzaniaPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("255")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}
