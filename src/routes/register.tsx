
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import "../styles.css";
import { apiPost, saveSession } from "../lib/client-auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Your Account | Chatlivos" },
      { name: "description", content: "Jisajili Chatlivos na uanze mchakato wa ku-activate account yako." },
    ],
  }),
  component: RegisterPage,
});

const countries = [
  "Tanzania", "Kenya", "Uganda", "Rwanda", "Burundi", "South Sudan", "DRC Congo",
];

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "", username: "", phone: "", email: "", country: "Tanzania",
    password: "", confirmPassword: "", agreed: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success?: boolean } | null>(null);

  function update(name: string, value: string | boolean) {
    setForm((old) => ({ ...old, [name]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (form.password !== form.confirmPassword) {
      setMessage({ text: "Password hazifanani." });
      return;
    }
    if (!form.agreed) {
      setMessage({ text: "Kubali Privacy Policy ili kuendelea." });
      return;
    }

    setLoading(true);
    try {
      const result = await apiPost<any>({
        action: "register",
        fullName: form.fullName,
        username: form.username,
        phone: form.phone,
        email: form.email,
        country: form.country,
        password: form.password,
      });

      if (result.accessToken) {
        saveSession(result.accessToken, result.refreshToken);
        await navigate({ to: "/payment" });
      } else {
        setMessage({
          success: true,
          text: "Account imetengenezwa. Kama email confirmation imewashwa kwenye Supabase, thibitisha email yako kisha ingia.",
        });
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Imeshindikana kujisajili. Jaribu tena." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-card">
          <Link to="/" className="auth-back">← Rudi Chatlivos</Link>
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-subtitle">Enter your personal details to create account</p>

          {message && <div className={`auth-message ${message.success ? "success" : ""}`}>{message.text}</div>}

          <form onSubmit={submit}>
            <label className="auth-label">Full Name</label>
            <div className="auth-input-wrap">
              <span className="auth-icon">✉</span>
              <input className="auth-input" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Full Name" required />
            </div>

            <label className="auth-label">Username</label>
            <div className="auth-input-wrap">
              <span className="auth-icon">✉</span>
              <input className="auth-input" value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="Username" required />
            </div>

            <label className="auth-label">Phone</label>
            <div className="auth-input-wrap phone">
              <span className="phone-prefix">+255</span>
              <input className="auth-input" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="7XXXXXXXX" inputMode="numeric" required />
            </div>

            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrap">
              <span className="auth-icon">✉</span>
              <input type="email" className="auth-input" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="user@gmail.com" required />
            </div>

            <label className="auth-label">Country</label>
            <select className="auth-select" value={form.country} onChange={(e) => update("country", e.target.value)}>
              {countries.map((country) => <option key={country}>{country}</option>)}
            </select>

            <div className="auth-grid2">
              <div>
                <label className="auth-label">Password</label>
                <input type="password" className="auth-input" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Password" required minLength={6} />
              </div>
              <div>
                <label className="auth-label">Confirm Password</label>
                <input type="password" className="auth-input" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Confirm Password" required minLength={6} />
              </div>
            </div>

            <label className="auth-check">
              <input type="checkbox" checked={form.agreed} onChange={(e) => update("agreed", e.target.checked)} />
              <span>Agree With Privacy Policy</span>
            </label>

            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? "INATENGENEZA ACCOUNT..." : "CREATE ACCOUNT"}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
