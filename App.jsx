import React, { useEffect, useState } from "react";
import { api, saveSession, clearSession, getToken, getUser } from "./api";
import { Coins, Flame, History, LogOut, Play, ShieldCheck, Sparkles, Volume2, X, ChevronLeft, Crown } from "lucide-react";

const fmt = n => new Intl.NumberFormat("id-ID").format(n || 0);

function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const data = await api(`/auth/${mode}`, { method: "POST", body: JSON.stringify({ username, password }) });
      saveSession(data); onSuccess(data);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="modal-backdrop"><form className="auth-card" onSubmit={submit}>
    <button className="icon-btn close" type="button" onClick={onClose}><X size={18}/></button>
    <div className="eyebrow">DRAGON KINGDOM ACCOUNT</div><h2>{mode === "login" ? "Selamat datang kembali" : "Buat akun petualang"}</h2>
    <label>Username<input value={username} onChange={e=>setUsername(e.target.value)} minLength="3" maxLength="32" required placeholder="nama_petualang"/></label>
    <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength="10" required placeholder="Minimal 10 karakter"/></label>
    {error && <p className="error">{error}</p>}
    <button className="primary-btn full" disabled={busy}>{busy ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}</button>
    <p className="switch-auth">{mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"} <button type="button" onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}}>{mode==="login"?"Daftar":"Masuk"}</button></p>
  </form></div>;
}

function Header({ user, balance, onAuth, onLogout }) {
  return <header className="topbar">
    <div className="brand-mini"><span className="brand-mark">🐉</span><span>DRAGON<span className="gold"> KINGDOM</span></span></div>
    <div className="top-actions">
      <div className="coin-pill"><Coins size={15}/><b>{fmt(balance)}</b></div>
      {user ? <button className="avatar" title="Keluar" onClick={onLogout}>{user.username.slice(0,1).toUpperCase()}</button> : <button className="login-link" onClick={onAuth}>Masuk</button>}
    </div>
  </header>;
}

function Lobby({ balance, onPlay, user, onAuth }) {
  return <main className="lobby page-wrap">
    <section className="hero">
      <div className="hero-glow"></div><div className="hero-copy">
        <div className="eyebrow"><Sparkles size={13}/> A REALM OF MAGIC & MYSTERY</div>
        <h1>THE DRAGON<br/><span>KINGDOM</span></h1>
        <p>Bangkitkan keberanianmu. Jelajahi kerajaan naga dalam petualangan koin virtual.</p>
        <button className="primary-btn" onClick={onPlay}><Play size={17} fill="currentColor"/> MULAI PETUALANGAN</button>
      </div>
      <div className="dragon-art" aria-label="Ilustrasi naga">🐉</div>
      <div className="hero-tag">SEASON 01 <b>·</b> THE AWAKENING</div>
    </section>

    <section className="welcome-row">
      <div><div className="eyebrow">PETUALANG</div><h2>{user ? user.username : "Penjelajah Kerajaan"}</h2><p>{user ? "Senang melihatmu kembali." : "Masuk atau daftar untuk menyimpan progres."}</p></div>
      {!user && <button className="outline-btn" onClick={onAuth}>Buat akun</button>}
    </section>

    <section className="section-heading"><div><div className="eyebrow">PILIH PETUALANGAN</div><h2>Gerbang Permainan</h2></div><span className="live-dot">SIMULASI</span></section>
    <article className="game-card">
      <div className="game-card-art"><div className="card-orbit"></div><span>🐲</span><div className="card-runes">✦　ᚱ　✧　ᛟ</div><div className="card-label">ORIGINAL EXPERIENCE</div></div>
      <div className="game-card-info"><div><span className="tag">FANTASY · 5×3</span><h3>Dragon's Fortune</h3><p>Temukan simbol kuno dan kumpulkan koin virtual.</p></div><button className="play-circle" onClick={onPlay}><Play size={20} fill="currentColor"/></button></div>
    </article>

    <section className="feature-grid">
      <div className="feature"><ShieldCheck/><b>Permainan aman</b><small>Hanya koin virtual</small></div>
      <div className="feature"><Sparkles/><b>Simbol orisinal</b><small>Dunia fantasi</small></div>
      <div className="feature"><History/><b>Riwayat</b><small>20 putaran terakhir</small></div>
    </section>
    <div className="disclaimer">DEMO GAME · TANPA UANG ASLI · TANPA DEPOSIT ATAU PENARIKAN</div>
  </main>;
}

function SlotGame({ balance, setBalance, onBack }) {
  const [bet, setBet] = useState(100);
  const [grid, setGrid] = useState(Array.from({length:3},()=>Array(5).fill(null)));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Pilih taruhan, lalu tekan SPIN.");
  const [lastWin, setLastWin] = useState(0);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  async function loadHistory() {
    try { const d = await api("/history"); setHistory(d.history); } catch {}
  }
  useEffect(()=>{ loadHistory(); }, []);
  async function spin() {
    if (busy) return;
    setBusy(true); setError(""); setMessage("Gulungan sedang berputar...");
    setGrid(Array.from({length:3},()=>Array(5).fill("✨")));
    try {
      const result = await api("/spin", { method:"POST", body:JSON.stringify({betAmount:bet}) });
      setGrid(result.grid); setBalance(result.balance); setLastWin(result.winAmount);
      setMessage(result.winAmount > 0 ? `Hebat! Kamu mendapat ${fmt(result.winAmount)} koin.` : "Belum ada kombinasi yang cocok. Coba lagi!");
      await loadHistory();
    } catch (err) { setError(err.message); setMessage("Putaran tidak dapat diproses."); }
    finally { setBusy(false); }
  }
  return <main className="game-page page-wrap">
    <button className="back-btn" onClick={onBack}><ChevronLeft size={18}/> KEMBALI KE LOBBY</button>
    <div className="game-title"><div className="eyebrow">THE ANCIENT REELS</div><h1>DRAGON'S <span>FORTUNE</span></h1><p>5 REEL · 3 ROW · 5 PAYLINES</p></div>
    <div className="game-balance"><span>SALDO KOIN VIRTUAL</span><b><Coins size={18}/> {fmt(balance)}</b></div>
    <section className="slot-frame">
      <div className="slot-top"><span>✦ DRAGON KINGDOM ✦</span><span>DEMO MODE</span></div>
      <div className="reels">
        {grid.map((row,r)=><div className="reel-row" key={r}>{row.map((cell,c)=><div className={`symbol-cell ${busy?"spinning":""}`} key={`${r}-${c}`}>{cell ? (typeof cell==="string"?cell:cell.icon) : <span className="question">✧</span>}</div>)}</div>)}
      </div>
      <div className="payline-note">5 GARIS PEMBAYARAN · 3+ SIMBOL BERURUTAN</div>
    </section>
    <div className="win-panel"><span>KEMENANGAN TERAKHIR</span><b>{fmt(lastWin)} <small>koin</small></b></div>
    <div className="controls">
      <div className="bet-control"><span>NILAI TARUHAN</span><div className="bet-buttons"><button disabled={busy||bet<=10} onClick={()=>setBet(v=>Math.max(10,v-10))}>−</button><b>{fmt(bet)}</b><button disabled={busy||bet>=1000} onClick={()=>setBet(v=>Math.min(1000,v+10))}>+</button></div></div>
      <button className="spin-btn" onClick={spin} disabled={busy||balance<bet}>{busy?"BERPUTAR...":"SPIN"} <Sparkles size={17}/></button>
    </div>
    {error && <p className="error center">{error}</p>}
    <p className="status-message">{message}</p>
    <section className="history-panel"><div className="section-heading"><div><div className="eyebrow">CATATAN PETUALANGAN</div><h2>Riwayat Putaran</h2></div><History size={20}/></div>
      {history.length===0 ? <p className="empty">Belum ada putaran. Riwayat akan muncul di sini.</p> : history.slice(0,8).map(item=><div className="history-item" key={item.id}><div><b>Taruhan {fmt(item.betAmount)}</b><small>{new Date(item.createdAt).toLocaleString("id-ID")}</small></div><strong className={item.winAmount>0?"positive":""}>{item.winAmount>0?"+":""}{fmt(item.winAmount)}</strong></div>)}
    </section>
    <div className="disclaimer">KOIN VIRTUAL SAJA · HASIL ACAK · TIDAK DAPAT DITUKARKAN DENGAN UANG</div>
  </main>;
}

export default function App() {
  const [user, setUser] = useState(getUser());
  const [balance, setBalance] = useState(10000);
  const [screen, setScreen] = useState("lobby");
  const [authOpen, setAuthOpen] = useState(false);
  useEffect(()=>{
    if (getToken()) api("/balance").then(d=>setBalance(d.balance)).catch(()=>{clearSession();setUser(null);});
  },[]);
  function logout(){clearSession();setUser(null);setBalance(10000);setScreen("lobby");}
  async function quickStart() {
    if (!getToken()) { setAuthOpen(true); return; }
    setScreen("game");
  }
  return <div className="app-shell">
    <Header user={user} balance={balance} onAuth={()=>setAuthOpen(true)} onLogout={logout}/>
    {screen==="lobby" ? <Lobby balance={balance} onPlay={quickStart} user={user} onAuth={()=>setAuthOpen(true)}/> :
      <SlotGame balance={balance} setBalance={setBalance} onBack={()=>setScreen("lobby")}/>}
    <footer className="footer">© 2026 DRAGON KINGDOM <span>·</span> ORIGINAL VIRTUAL COIN DEMO</footer>
    {authOpen && <AuthModal onClose={()=>setAuthOpen(false)} onSuccess={data=>{setUser(data.user);setBalance(data.balance);setAuthOpen(false);setScreen("game");}}/>}
  </div>;
}
