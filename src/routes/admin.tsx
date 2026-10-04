import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import "../styles.css";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Chatlivos Admin Panel" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminPage,
});

type AdminUser = { user_id?: string; id: string; email: string; full_name: string; username: string; phone: string; country: string; is_active: boolean; is_banned: boolean; ban_reason?: string; balance: number; created_at: string; activated_at?: string };

function AdminPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function adminFetch(body: any, currentToken = token) {
    const response = await fetch("/api", { method: "POST", headers: { "Content-Type": "application/json", ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}) }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.message || "Ombi la admin limeshindwa.");
    return data;
  }

  async function loadUsers(currentToken = token) {
    if (!currentToken) return;
    try {
      const result = await adminFetch({ action: "admin-users" }, currentToken);
      setUsers(result.users || []); setTotal(result.total || 0);
    } catch (e) {
      setToken(""); localStorage.removeItem("chatlivos_admin_access_token");
      setNotice(e instanceof Error ? e.message : "Admin session imeisha.");
    }
  }

  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const result = await fetch("/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "admin-login", email, password }) });
      const data = await result.json();
      if (!result.ok || !data.ok) throw new Error(data.message || "Admin login imeshindikana.");
      localStorage.setItem("chatlivos_admin_access_token", data.accessToken);
      localStorage.setItem("chatlivos_admin_refresh_token", data.refreshToken || "");
      setToken(data.accessToken); setPassword("");
      await loadUsers(data.accessToken);
    } catch (e) { setNotice(e instanceof Error ? e.message : "Admin login imeshindikana."); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const saved = localStorage.getItem("chatlivos_admin_access_token") || "";
    if (saved) setToken(saved);
  }, []);

  useEffect(() => { if (token) void loadUsers(token); }, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.full_name, u.username, u.email, u.phone, u.country].join(" ").toLowerCase().includes(q));
  }, [users, search]);

  async function setUser(userId: string, operation: string) {
    setBusy(true); setNotice("");
    try {
      const body: any = { action: "admin-set-user", userId, operation };
      if (operation === "ban") body.reason = window.prompt("Sababu ya ban (optional):") || "";
      const response = await fetch("/api", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Imeshindikana.");
      await loadUsers(token); setNotice("Mabadiliko yamehifadhiwa.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Imeshindikana."); }
    finally { setBusy(false); }
  }

  async function sendNotification(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const response = await fetch("/api", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: "admin-notify", target, userId: selected, title, message }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "Imeshindikana kutuma notification.");
      setTitle(""); setMessage(""); setNotice("Notification imetumwa.");
    } catch (e) { setNotice(e instanceof Error ? e.message : "Imeshindikana kutuma notification."); }
    finally { setBusy(false); }
  }

  if (!token) return (
    <main className="admin-page"><div className="admin-login-card">
      <div className="admin-brand">Chatlivos <span>ADMIN</span></div>
      <h1>Admin Login</h1><p>Ingia kwa Supabase Auth account ambayo imeongezwa kwenye <b>chatlivos_admin_users</b>.</p>
      {notice && <div className="admin-alert">{notice}</div>}
      <form onSubmit={login}>
        <label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="admin@example.com" />
        <label>Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="Password" />
        <button disabled={busy}>{busy ? "INAINGIA..." : "INGIA ADMIN"}</button>
      </form>
    </div></main>
  );

  return <main className="admin-page"><div className="admin-shell">
    <div className="admin-top"><div><div className="admin-brand">Chatlivos <span>ADMIN</span></div><div className="admin-subtitle">User management & notifications</div></div><button className="admin-logout" onClick={() => { localStorage.removeItem("chatlivos_admin_access_token"); localStorage.removeItem("chatlivos_admin_refresh_token"); setToken(""); }}>Logout</button></div>
    {notice && <div className="admin-alert">{notice}</div>}
    <div className="admin-stats"><div><strong>{total}</strong><span>Jumla ya Users</span></div><div><strong>{users.filter((u) => u.is_active && !u.is_banned).length}</strong><span>Active</span></div><div><strong>{users.filter((u) => !u.is_active && !u.is_banned).length}</strong><span>Pending</span></div><div><strong>{users.filter((u) => u.is_banned).length}</strong><span>Banned</span></div></div>

    <section className="admin-card"><div className="admin-section-head"><h2>Users</h2><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, username, email..." /></div>
      <div className="admin-table-wrap"><table><thead><tr><th>User</th><th>Phone</th><th>Country</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead><tbody>
        {filtered.map((u) => <tr key={u.id}><td><b>{u.full_name}</b><small>@{u.username}<br />{u.email}</small></td><td>{u.phone ? `+255 ${u.phone}` : "—"}</td><td>{u.country}</td><td><span className={`status-pill ${u.is_banned ? "banned" : u.is_active ? "active" : "pending"}`}>{u.is_banned ? "BANNED" : u.is_active ? "ACTIVE" : "PENDING"}</span></td><td>{new Date(u.created_at).toLocaleString()}</td><td className="admin-actions"><button onClick={() => setUser(u.id, "activate")} disabled={busy || (u.is_active && !u.is_banned)}>Activate</button>{u.is_banned ? <button onClick={() => setUser(u.id, "unban")} disabled={busy}>Unban</button> : <button className="danger" onClick={() => setUser(u.id, "ban")} disabled={busy}>Ban</button>}{u.is_active && !u.is_banned && <button onClick={() => setUser(u.id, "deactivate")} disabled={busy}>Deactivate</button>}</td></tr>)}
      </tbody></table></div>
    </section>

    <section className="admin-card"><h2>Send Notification</h2><form className="admin-notify-form" onSubmit={sendNotification}><label>Target<select value={target} onChange={(e) => setTarget(e.target.value)}><option value="all">All users</option><option value="one">One user</option></select></label>{target === "one" && <label>User<select value={selected} onChange={(e) => setSelected(e.target.value)} required><option value="">Choose user...</option>{users.map((u) => <option key={u.id} value={u.id}>{u.full_name} — @{u.username}</option>)}</select></label>}<label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label><label>Message<textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} required /></label><button disabled={busy}>{busy ? "INATUMA..." : "TUMA NOTIFICATION"}</button></form></section>

    <section className="admin-card"><h2>Registration Information</h2><p className="admin-muted">Kila user anaonekana hapo juu pamoja na jina, username, email, simu, nchi, status na tarehe/saa aliyojisajili. Admin anaweza pia kuona idadi ya waliojisajili kupitia counter ya juu.</p></section>
  </div></main>;
}
