
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import "../styles/auth.css";
import { apiPost, saveSession } from "../lib/client-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login | Chatlivos" },
      { name: "description", content: "Ingia kwenye account yako ya Chatlivos." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const result = await apiPost<any>({ action: "login", identifier, password });
      saveSession(result.accessToken, result.refreshToken);

      if (result.profile?.is_active) {
        await navigate({ to: "/dashboard" });
      } else {
        await navigate({ to: "/payment" });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Imeshindikana kuingia.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page" style={{ background: "#fff" }}>
      <div className="auth-shell" style={{ maxWidth: 620 }}>
        <div className="auth-card" style={{ boxShadow: "none", paddingTop: 70 }}>
          <Link to="/" className="auth-back">← Rudi Chatlivos</Link>
          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">Welcome back! Log in to your account.</p>

          {message && <div className="auth-message">{message}</div>}

          <form onSubmit={submit}>
            <label className="auth-label">Username</label>
            <div className="auth-input-wrap">
              <span className="auth-icon">✉</span>
              <input className="auth-input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="username" required />
            </div>

            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-icon">♙</span>
              <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="**********" required />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
              <label className="auth-check" style={{ margin: 0 }}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>Remember password</span>
              </label>
              <span style={{ color: "#4f8b7f", fontWeight: 700 }}>Forgot password?</span>
            </div>

            <button className="auth-button login" type="submit" disabled={loading} style={{ marginTop: 28 }}>
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          <div className="auth-footer" style={{ marginTop: 42 }}>
            Don't have an account? <Link to="/register">Create Account</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
