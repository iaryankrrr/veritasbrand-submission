import { useState, useEffect } from "react";
import { registerUser, uploadDocument, updateStatus } from "./api";

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export default function App() {
  const [accounts, setAccounts] = useState(() => load("vb_accounts", []));
  const [user, setUser] = useState(() => load("vb_user", null));
  const [docs, setDocs] = useState(() => load("vb_docs", []));
  const [page, setPage] = useState("dashboard");

  useEffect(() => save("vb_accounts", accounts), [accounts]);
  useEffect(() => save("vb_user", user), [user]);
  useEffect(() => save("vb_docs", docs), [docs]);

  const signedIn = (u) => { setUser(u); setPage("dashboard"); };
  const signOut = () => setUser(null);

  if (!user) return <Auth accounts={accounts} setAccounts={setAccounts} onDone={signedIn} />;

  const mine = docs.filter((d) => d.userId === user.id);
  return (
    <div className="shell">
      <aside className="side">
        <div className="logo">Veritas<span>Brand</span></div>
        <nav>
          <button className={page === "dashboard" ? "on" : ""} onClick={() => setPage("dashboard")}>Documents</button>
          <button className={page === "upload" ? "on" : ""} onClick={() => setPage("upload")}>Upload</button>
        </nav>
        <div className="who">
          <strong>{user.username}</strong>
          <small>{user.role}</small>
          <button className="link" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="main">
        {page === "upload"
          ? <Upload user={user} onUploaded={(d) => { setDocs([d, ...docs]); setPage("dashboard"); }} />
          : <Dashboard docs={mine} setDocs={setDocs} all={docs} goUpload={() => setPage("upload")} />}
      </main>
    </div>
  );
}

function Auth({ accounts, setAccounts, onDone }) {
  const [mode, setMode] = useState("register");
  const [f, setF] = useState({ username: "", password: "", role: "USER" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!f.username.trim() || !f.password) return setErr("Enter a username and password.");
    if (mode === "login") {
      const a = accounts.find((x) => x.username === f.username && x.password === f.password);
      return a ? onDone(a) : setErr("No account on this device matches. Register first.");
    }
    setBusy(true);
    try {
      const res = await registerUser(f.username.trim(), f.password, f.role);
      const id = res?.id ?? res?.userId ?? res?.user?.id;
      if (id == null) throw new Error("Registered, but the server did not return a user ID.");
      const acct = { id, username: f.username.trim(), password: f.password, role: f.role };
      setAccounts([...accounts, acct]);
      onDone(acct);
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  }

  return (
    <div className="auth">
      <div className="auth-art">
        <h1>Every brand document, verified before it ships.</h1>
        <p>Upload brand files, review them, and mark each one approved or rejected.</p>
      </div>
      <form className="card" onSubmit={submit}>
        <h2>{mode === "register" ? "Create your account" : "Sign in"}</h2>
        <label>Username<input value={f.username} onChange={set("username")} autoComplete="username" /></label>
        <label>Password<input type="password" value={f.password} onChange={set("password")} autoComplete="current-password" /></label>
        {mode === "register" && (
          <label>Role
            <select value={f.role} onChange={set("role")}>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
        )}
        {err && <p className="err">{err}</p>}
        {busy && <p className="hint">Contacting the server. The first request can take up to 50 seconds while it wakes up.</p>}
        <button className="btn" disabled={busy}>{busy ? "Waiting for server..." : mode === "register" ? "Create account" : "Sign in"}</button>
        <button type="button" className="link" onClick={() => { setErr(""); setMode(mode === "register" ? "login" : "register"); }}>
          {mode === "register" ? "Already registered? Sign in" : "New here? Create an account"}
        </button>
      </form>
    </div>
  );
}

function Upload({ user, onUploaded }) {
  const [file, setFile] = useState(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function send() {
    setErr(""); setBusy(true);
    try {
      const fileContent = file ? await file.text().catch(() => "Unable to read text") : "No content";
      const payload = {
        title: file ? file.name : "Brand Document",
        content: fileContent,
        type: "MARKETING",
        status: "PENDING"
      };
      
      const res = await uploadDocument(user.id, payload);
      onUploaded({
        id: res?.id ?? res?.documentId ?? Date.now(),
        userId: user.id,
        name: res?.fileName ?? res?.name ?? (file ? file.name : "Document"),
        status: res?.status ?? "PENDING",
        uploadedAt: new Date().toISOString(),
      });
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <section>
      <h1>Upload a brand document</h1>
      <div
        className={"drop" + (over ? " over" : "")}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); setFile(e.dataTransfer.files[0] || null); }}
      >
        <p>{file ? file.name : "Drag a file here, or choose one"}</p>
        <input id="pick" type="file" hidden onChange={(e) => setFile(e.target.files[0] || null)} />
        <label htmlFor="pick" className="btn ghost">Choose file</label>
      </div>
      {err && <p className="err">{err}</p>}
      {busy && <p className="hint">Uploading. If the server was asleep this can take up to 50 seconds.</p>}
      <button className="btn" disabled={!file || busy} onClick={send}>{busy ? "Uploading..." : "Upload document"}</button>
    </section>
  );
}

function Dashboard({ docs, all, setDocs, goUpload }) {
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState("");

  async function act(id, status) {
    setErr(""); setBusyId(id);
    try {
      await updateStatus(id, status);
      setDocs(all.map((d) => (d.id === id ? { ...d, status } : d)));
    } catch (e) { setErr(e.message); }
    setBusyId(null);
  }

  return (
    <section>
      <div className="row">
        <h1>Documents</h1>
        <button className="btn" onClick={goUpload}>Upload document</button>
      </div>
      {err && <p className="err">{err}</p>}
      {docs.length === 0 ? (
        <div className="empty">No documents yet. Upload your first brand file to start a review.</div>
      ) : (
        <ul className="list">
          {docs.map((d) => (
            <li key={d.id}>
              <div>
                <strong>{d.name}</strong>
                <small>Uploaded {new Date(d.uploadedAt).toLocaleString()}</small>
              </div>
              <span className={"badge " + String(d.status).toLowerCase()}>{d.status}</span>
              <div className="acts">
                <button className="btn ok" disabled={busyId === d.id || d.status === "APPROVED"} onClick={() => act(d.id, "APPROVED")}>Approve</button>
                <button className="btn no" disabled={busyId === d.id || d.status === "REJECTED"} onClick={() => act(d.id, "REJECTED")}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}