const getEnv = (name: string, fallback?: string) => {
  const value = (globalThis as any)?.process?.env?.[name] ?? fallback;
  return typeof value === "string" ? value : "";
};

export const SUPABASE_URL = getEnv("SUPABASE_URL") || getEnv("VITE_SUPABASE_URL");
export const SUPABASE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY") || "";
export const SUPABASE_PUBLISHABLE_KEY = getEnv("VITE_SUPABASE_PUBLISHABLE_KEY") || getEnv("SUPABASE_ANON_KEY");
export const FIMIPAY_SECRET_KEY = getEnv("FIMIPAY_SECRET_KEY");
export const ACTIVATION_AMOUNT = Number(getEnv("FIMIPAY_AMOUNT", "16000")) || 16000;

export function requireEnv(name: string, value: string) {
  if (!value) throw new Error(`${name} is not configured`);
}

export function normalizeTanzaniaPhone(input: string): { local: string; international: string } {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.startsWith("00255")) digits = digits.slice(2);
  if (digits.startsWith("255")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!/^[67]\d{8}$/.test(digits)) throw new Error("Namba ya simu si sahihi. Tumia 06XXXXXXXX au 07XXXXXXXX.");
  return { local: digits, international: `255${digits}` };
}

export async function supabaseAuthRequest(path: string, init: RequestInit = {}, accessToken?: string) {
  requireEnv("VITE_SUPABASE_URL", SUPABASE_URL);
  requireEnv("VITE_SUPABASE_PUBLISHABLE_KEY", SUPABASE_PUBLISHABLE_KEY);
  const headers = new Headers(init.headers);
  headers.set("apikey", SUPABASE_PUBLISHABLE_KEY);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(`${SUPABASE_URL}${path}`, { ...init, headers });
}

export async function supabaseServiceAuthRequest(path: string, init: RequestInit = {}) {
  requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_KEY);
  requireEnv("VITE_SUPABASE_URL", SUPABASE_URL);
  const headers = new Headers(init.headers);
  headers.set("apikey", SUPABASE_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_KEY}`);
  headers.set("Content-Type", "application/json");
  return fetch(`${SUPABASE_URL}${path}`, { ...init, headers });
}

export async function supabaseServiceRequest(path: string, init: RequestInit = {}) {
  requireEnv("VITE_SUPABASE_URL", SUPABASE_URL);
  requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_KEY);
  const headers = new Headers(init.headers);
  headers.set("apikey", SUPABASE_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_KEY}`);
  headers.set("Content-Type", "application/json");
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, { ...init, headers });
}

export async function getSupabaseUser(accessToken: string) {
  const response = await supabaseAuthRequest("/auth/v1/user", { method: "GET" }, accessToken);
  if (!response.ok) return null;
  return (await response.json()) as { id: string; email?: string; user_metadata?: Record<string, unknown> };
}

export async function getProfile(userId: string) {
  const response = await supabaseServiceRequest(`/chatlivos_profiles?select=*&id=eq.${encodeURIComponent(userId)}&limit=1`);
  if (!response.ok) return null;
  const rows = await response.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export async function getProfileByUsername(username: string) {
  const response = await supabaseServiceRequest(`/chatlivos_profiles?select=*&username=eq.${encodeURIComponent(username)}&limit=1`);
  if (!response.ok) return null;
  const rows = await response.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export async function upsertProfile(profile: Record<string, unknown>) {
  const response = await supabaseServiceRequest("/chatlivos_profiles?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(profile),
  });
  if (!response.ok) throw new Error(`Profile save failed: ${await response.text()}`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function updateProfile(userId: string, patch: Record<string, unknown>) {
  const response = await supabaseServiceRequest(`/chatlivos_profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new Error(`Profile update failed: ${await response.text()}`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function createPaymentOrderRecord(record: Record<string, unknown>) {
  const response = await supabaseServiceRequest("/chatlivos_payment_orders", {
    method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(record),
  });
  if (!response.ok) throw new Error(`Payment record save failed: ${await response.text()}`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function getPaymentOrder(orderId: string, userId: string) {
  const response = await supabaseServiceRequest(`/chatlivos_payment_orders?select=*&order_id=eq.${encodeURIComponent(orderId)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`);
  if (!response.ok) return null;
  const rows = await response.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export async function updatePaymentOrder(orderId: string, patch: Record<string, unknown>) {
  const response = await supabaseServiceRequest(`/chatlivos_payment_orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch),
  });
  if (!response.ok) throw new Error(`Payment update failed: ${await response.text()}`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function getAdminUser(userId: string) {
  const response = await supabaseServiceRequest(`/chatlivos_admin_users?select=*&user_id=eq.${encodeURIComponent(userId)}&is_active=eq.true&limit=1`);
  if (!response.ok) return null;
  const rows = await response.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export async function listChatlivosUsers() {
  const response = await supabaseServiceRequest(`/chatlivos_profiles?select=*&order=created_at.desc`);
  if (!response.ok) throw new Error(`Users load failed: ${await response.text()}`);
  return await response.json();
}

export async function countChatlivosUsers() {
  const response = await supabaseServiceRequest(`/chatlivos_profiles?select=id`, { headers: { Prefer: "count=exact" } });
  if (!response.ok) throw new Error(`Users count failed: ${await response.text()}`);
  const range = response.headers.get("content-range") || "*/0";
  const total = Number(range.split("/")[1] || 0);
  return Number.isFinite(total) ? total : 0;
}

export async function createNotification(record: Record<string, unknown>) {
  const response = await supabaseServiceRequest("/chatlivos_notifications", {
    method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(record),
  });
  if (!response.ok) throw new Error(`Notification failed: ${await response.text()}`);
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function listUserNotifications(userId: string) {
  const response = await supabaseServiceRequest(`/chatlivos_notifications?select=*&or=(user_id.is.null,user_id.eq.${encodeURIComponent(userId)})&order=created_at.desc&limit=30`);
  if (!response.ok) return [];
  return await response.json();
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
