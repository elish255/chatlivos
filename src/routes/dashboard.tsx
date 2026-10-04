
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import "../styles.css";
import { apiPost, clearSession, getMe } from "../lib/client-auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Chatlivos" },
      { name: "description", content: "Dashboard ya Chatlivos." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    getMe().then(async (me) => {
      if (!me?.profile) {
        await navigate({ to: "/login" });
        return;
      }
      if (!me.profile.is_active) {
        await navigate({ to: "/payment" });
        return;
      }
      setProfile(me.profile);
      const noticeResult = await apiPost<any>({ action: "notifications" }, true).catch(() => ({ notifications: [] }));
      setNotifications(noticeResult.notifications || []);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return <main className="dashboard"><div className="dashboard-shell"><div className="dashboard-card">Inapakia dashboard...</div></div></main>;
  }

  return (
    <main className="dashboard">
      <div className="dashboard-shell">
        <div className="dashboard-top">
          <div className="dashboard-logo">Chatlivos</div>
          <button className="dashboard-logout" onClick={async () => {
            clearSession();
            await navigate({ to: "/login" });
          }}>Logout</button>
        </div>

        <section className="dashboard-card">
          <span className="dashboard-badge">ACCOUNT ACTIVE</span>
          <h1>Karibu, {profile?.full_name || profile?.username}</h1>
          <p className="dashboard-muted">Account yako ime-activate. Sasa unaweza kuanza kuchat na foreign learners.</p>
        </section>

        {notifications.length > 0 && (
          <section className="dashboard-card">
            <h2>Notifications</h2>
            <div className="dashboard-notifications">
              {notifications.map((n) => (
                <div className="dashboard-notification" key={n.id}>
                  <strong>{n.title}</strong>
                  <div>{n.message}</div>
                  <small>{new Date(n.created_at).toLocaleString()}</small>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="dashboard-card">
          <h2>Ready to chat?</h2>
          <p className="dashboard-muted">Rudi kwenye profiles, chagua foreigner na bonyeza START CHAT.</p>
          <Link
            to="/"
            style={{
              display: "inline-flex", marginTop: 18, background: "#087f68", color: "#fff",
              padding: "13px 20px", borderRadius: 12, textDecoration: "none", fontWeight: 900,
            }}
          >
            START CHATTING
          </Link>
        </section>
      </div>
    </main>
  );
}
