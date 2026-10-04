import { createFileRoute } from "@tanstack/react-router";
import {
  ACTIVATION_AMOUNT,
  FIMIPAY_SECRET_KEY,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  createPaymentOrderRecord,
  getPaymentOrder,
  getProfile,
  getProfileByUsername,
  getSupabaseUser,
  json,
  normalizeTanzaniaPhone,
  requireEnv,
  supabaseAuthRequest,
  updatePaymentOrder,
  updateProfile,
  upsertProfile,
} from "../lib/backend";

const FIMIPAY_URL = "https://fimipay.com/api/v1";

async function readBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function requireUser(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { token: "", user: null };
  return { token, user: await getSupabaseUser(token) };
}

async function createRegistration(body: any) {
  const fullName = String(body.fullName ?? "").trim();
  const username = String(body.username ?? "").trim().toLowerCase();
  const phoneInput = String(body.phone ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const country = String(body.country ?? "").trim();
  const password = String(body.password ?? "");

  if (!fullName || !username || !phoneInput || !email || !country || password.length < 6) {
    return json({ ok: false, message: "Jaza taarifa zote. Password iwe angalau herufi 6." }, 400);
  }

  const phone = normalizeTanzaniaPhone(phoneInput);

  const signup = await supabaseAuthRequest("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      data: {
        full_name: fullName,
        username,
        phone: phone.local,
        country,
      },
    }),
  });

  const signupData = await signup.json().catch(() => ({}));
  if (!signup.ok || !signupData?.user?.id) {
    const message =
      signupData?.msg ||
      signupData?.error_description ||
      signupData?.message ||
      "Imeshindikana kujisajili. Jaribu tena.";
    return json({ ok: false, message }, signup.status || 400);
  }

  const profile = await upsertProfile({
    id: signupData.user.id,
    email,
    full_name: fullName,
    username,
    phone: phone.local,
    country,
    is_active: false,
    balance: 0,
  });

  return json({
    ok: true,
    requiresEmailConfirmation: !signupData.session,
    accessToken: signupData.session?.access_token ?? null,
    refreshToken: signupData.session?.refresh_token ?? null,
    profile,
  });
}

async function login(body: any) {
  const identifier = String(body.identifier ?? body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (!identifier || !password) {
    return json({ ok: false, message: "Weka username/email na password." }, 400);
  }

  let email = identifier.toLowerCase();
  if (!identifier.includes("@")) {
    const found = await getProfileByUsername(identifier.toLowerCase());
    if (!found?.email) {
      return json({ ok: false, message: "Username au password si sahihi." }, 401);
    }
    email = String(found.email).toLowerCase();
  }

  const response = await supabaseAuthRequest("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.access_token) {
    return json(
      {
        ok: false,
        message:
          data?.error_description ||
          data?.msg ||
          "Email au password si sahihi.",
      },
      response.status || 401,
    );
  }

  let profile = await getProfile(data.user.id);
  if (!profile) {
    profile = await upsertProfile({
      id: data.user.id,
      email: data.user.email ?? email,
      full_name: data.user.user_metadata?.full_name ?? "",
      username: data.user.user_metadata?.username ?? "",
      phone: data.user.user_metadata?.phone ?? "",
      country: data.user.user_metadata?.country ?? "Tanzania",
      is_active: false,
      balance: 0,
    });
  }

  return json({
    ok: true,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    profile,
  });
}

async function refreshSession(body: any) {
  const refreshToken = String(body.refreshToken ?? "");
  if (!refreshToken) return json({ ok: false, message: "Session imeisha." }, 401);

  const response = await supabaseAuthRequest("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.access_token) {
    return json({ ok: false, message: "Session imeisha. Ingia tena." }, 401);
  }

  const profile = await getProfile(data.user.id);
  return json({
    ok: true,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    profile,
  });
}

async function me(request: Request) {
  const { token, user } = await requireUser(request);
  if (!token || !user) return json({ ok: false, message: "Not authenticated" }, 401);

  const profile = await getProfile(user.id);
  return json({ ok: true, user, profile });
}

async function createOrder(request: Request, body: any) {
  const { token, user } = await requireUser(request);
  if (!token || !user) return json({ ok: false, message: "Ingia kwanza." }, 401);

  const profile = await getProfile(user.id);
  if (!profile) return json({ ok: false, message: "Account haijapatikana." }, 404);
  if (profile.is_active) return json({ ok: true, active: true, message: "Account yako tayari iko Active." });

  const phone = normalizeTanzaniaPhone(String(body.phone ?? profile.phone ?? ""));
  requireEnv("FIMIPAY_SECRET_KEY", FIMIPAY_SECRET_KEY);

  const paymentResponse = await fetch(`${FIMIPAY_URL}/payment/create_order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Chatlivos/1.0",
      Authorization: `Bearer ${FIMIPAY_SECRET_KEY}`,
    },
    body: JSON.stringify({
      buyer_email: profile.email ?? user.email,
      buyer_name: profile.full_name ?? "",
      buyer_phone: phone.international,
      amount: ACTIVATION_AMOUNT,
      currency: "TZS",
      payment_method: "mobile",
    }),
  });

  const data = await paymentResponse.json().catch(() => ({}));
  if (!paymentResponse.ok || data?.status !== "success" || !data?.data?.order_id) {
    return json(
      {
        ok: false,
        message: data?.message || "Imeshindikana kuanzisha malipo. Jaribu tena.",
      },
      paymentResponse.status || 502,
    );
  }

  const order = await createPaymentOrderRecord({
    user_id: user.id,
    order_id: data.data.order_id,
    paid_phone: phone.local,
    paid_phone_international: phone.international,
    amount: ACTIVATION_AMOUNT,
    currency: "TZS",
    status: data.data.payment_status ?? "PENDING",
    provider_status: data.data.payment_status ?? "PENDING",
  });

  return json({
    ok: true,
    orderId: data.data.order_id,
    status: data.data.payment_status ?? "PENDING",
    amount: ACTIVATION_AMOUNT,
    phone: phone.local,
    payment: order,
  });
}

async function checkOrderStatus(request: Request, body: any) {
  const { token, user } = await requireUser(request);
  if (!token || !user) return json({ ok: false, message: "Ingia kwanza." }, 401);

  const orderId = String(body.orderId ?? "").trim();
  if (!orderId) return json({ ok: false, message: "Order haipo." }, 400);

  const order = await getPaymentOrder(orderId, user.id);
  if (!order) return json({ ok: false, message: "Malipo hayapatikani." }, 404);

  requireEnv("FIMIPAY_SECRET_KEY", FIMIPAY_SECRET_KEY);

  const statusResponse = await fetch(`${FIMIPAY_URL}/payment/order_status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Chatlivos/1.0",
      Authorization: `Bearer ${FIMIPAY_SECRET_KEY}`,
    },
    body: JSON.stringify({ order_id: orderId }),
  });

  const data = await statusResponse.json().catch(() => ({}));
  if (!statusResponse.ok || data?.status !== "success") {
    return json({ ok: false, message: data?.message || "Imeshindikana kuangalia status ya malipo." }, 502);
  }

  const paymentStatus = String(data?.data?.payment_status ?? "PENDING").toUpperCase();
  const update: Record<string, unknown> = {
    status: paymentStatus,
    provider_status: paymentStatus,
    transid: data?.data?.transid ?? null,
    channel: data?.data?.channel ?? null,
    environment: data?.data?.environment ?? null,
    updated_at: new Date().toISOString(),
  };
  await updatePaymentOrder(orderId, update);

  let profile = await getProfile(user.id);
  if (paymentStatus === "SUCCESS" || paymentStatus === "COMPLETED") {
    profile = await updateProfile(user.id, {
      is_active: true,
      activated_at: new Date().toISOString(),
    });
  }

  return json({
    ok: true,
    status: paymentStatus,
    completed: paymentStatus === "SUCCESS" || paymentStatus === "COMPLETED",
    terminal: ["SUCCESS", "COMPLETED", "CANCELLED", "USERCANCELLED", "REJECTED"].includes(paymentStatus),
    profile,
  });
}

export const Route = createFileRoute("/api")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return me(request);
      },
      POST: async ({ request }) => {
        try {
          const body = await readBody(request);
          switch (String(body.action ?? "")) {
            case "register":
              return createRegistration(body);
            case "login":
              return login(body);
            case "refresh":
              return refreshSession(body);
            case "create-order":
              return createOrder(request, body);
            case "order-status":
              return checkOrderStatus(request, body);
            default:
              return json({ ok: false, message: "Action haijatambuliwa." }, 400);
          }
        } catch (error) {
          console.error(error);
          return json(
            {
              ok: false,
              message:
                error instanceof Error
                  ? error.message
                  : "Kuna tatizo kwenye server. Jaribu tena.",
            },
            500,
          );
        }
      },
    },
  },
});
