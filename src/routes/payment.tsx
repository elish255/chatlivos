
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import "../styles.css";
import { apiPost, getMe, normalizeLocalTanzaniaPhone } from "../lib/client-auth";

export const Route = createFileRoute("/payment")({
  head: () => ({
    meta: [
      { title: "Activate Account | Chatlivos" },
      { name: "description", content: "Kamilisha activation ya account yako ya Chatlivos." },
    ],
  }),
  component: PaymentPage,
});

function PaymentPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [profileName, setProfileName] = useState("");
  const [amount, setAmount] = useState(16000);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    let mounted = true;
    getMe().then(async (me) => {
      if (!mounted) return;
      if (!me?.profile) {
        await navigate({ to: "/register" });
        return;
      }
      if (me.profile.is_active) {
        await navigate({ to: "/dashboard" });
        return;
      }
      setProfileName(me.profile.full_name || me.profile.username || "");
      setPhone(me.profile.phone || "");
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [navigate]);

  async function startPayment() {
    setMessage("");
    setStatus("");
    const local = normalizeLocalTanzaniaPhone(phone);
    if (!/^[67]\d{8}$/.test(local)) {
      setMessage("Weka namba sahihi ya Tanzania, mfano 0712345678.");
      return;
    }

    setPaying(true);
    try {
      const created = await apiPost<any>({
        action: "create-order",
        phone: local,
      }, true);

      if (created.active) {
        await navigate({ to: "/dashboard" });
        return;
      }

      setAmount(created.amount || 16000);
      setOrderId(created.orderId);
      setStatus("Ombi la malipo limetumwa. Angalia simu yako na ukamilishe malipo.");
      await pollPayment(created.orderId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Imeshindikana kuanzisha malipo.");
      setPaying(false);
    }
  }

  async function pollPayment(id: string) {
    let attempts = 0;
    while (attempts < 45) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      attempts += 1;
      try {
        const result = await apiPost<any>({ action: "order-status", orderId: id }, true);
        const current = result.status;
        if (current === "SUCCESS" || current === "COMPLETED") {
          setStatus("Malipo yamekamilika. Account yako imekuwa Active.");
          setPaying(false);
          setTimeout(() => navigate({ to: "/dashboard" }), 900);
          return;
        }
        if (["CANCELLED", "USERCANCELLED", "REJECTED"].includes(current)) {
          setStatus("Malipo hayajakamilika. Unaweza kujaribu tena.");
          setPaying(false);
          return;
        }
        setStatus("Tunasubiri uthibitisho wa malipo...");
      } catch {
        // Keep polling briefly; the payment may still be processing.
      }
    }

    setStatus("Muda wa kusubiri umeisha. Kama umelipa, ingia tena baada ya muda mfupi.");
    setPaying(false);
  }

  if (loading) {
    return <main className="auth-page"><div className="auth-shell"><div className="auth-card"><h2>Inapakia...</h2></div></div></main>;
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-card payment-card">
          <div className="payment-head">
            <div className="payment-brand">
              <div className="payment-light-icon">ϟ</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>Tanzania</div>
                <div style={{ color: "#a1aab7", fontSize: 17 }}>Lipa moja kwa moja</div>
              </div>
            </div>
            <div className="payment-country" style={{ background: "linear-gradient(145deg,#1b7f4d 0 45%,#f4d21f 45% 55%,#151b31 55%)" }} />
          </div>

          <div className="payment-body">
            <div className="payment-amount">Activation: TZS {amount.toLocaleString()}</div>
            <div className="payment-label">NAMBA YA SIMU</div>
            <div className="payment-phone">
              <div className="payment-prefix"><span>🇹🇿</span> +255</div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(-10))}
                placeholder="06XXXXXXXX"
                inputMode="numeric"
                disabled={paying}
              />
            </div>

            <button className="payment-button" onClick={startPayment} disabled={paying}>
              {paying ? "INASUBIRI MALIPO..." : "🔒 LIPA SASA"}
            </button>

            <div className="payment-status">
              {profileName && <div style={{ marginBottom: 6 }}>Account: <strong>{profileName}</strong></div>}
              {status}
            </div>
            {orderId && <div className="payment-note">Ombi lako linaendelea kuchakatwa kwa usalama.</div>}
            {message && <div className="auth-message">{message}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}
