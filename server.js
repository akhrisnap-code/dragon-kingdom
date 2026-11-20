import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { pool } from "./db.js";
import { requireAuth, signToken } from "./auth.js";
import { createSpin, publicSymbols, PAYLINES } from "./game.js";

dotenv.config();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET wajib diisi dan minimal 32 karakter.");
}

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "20kb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
app.use("/api/spin", rateLimit({ windowMs: 60 * 1000, limit: 30 }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/game-info", (_req, res) => res.json({
  title: "Dragon Kingdom",
  rows: 3,
  reels: 5,
  paylines: PAYLINES.length,
  symbols: publicSymbols,
  currency: "virtual_coins"
}));

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      return res.status(400).json({ error: "Username 3–32 karakter: huruf, angka, garis bawah." });
    }
    if (password.length < 10 || password.length > 72) {
      return res.status(400).json({ error: "Password harus 10–72 karakter." });
    }
    const hash = await bcrypt.hash(password, 12);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        "INSERT INTO users(username,password_hash) VALUES($1,$2) RETURNING id,username",
        [username, hash]
      );
      const user = result.rows[0];
      await client.query("INSERT INTO wallets(user_id,balance) VALUES($1,10000)", [user.id]);
      await client.query("COMMIT");
      res.status(201).json({
        token: signToken(user),
        user: { id: user.id, username: user.username },
        balance: 10000
      });
    } catch (err) {
      await client.query("ROLLBACK");
      if (err.code === "23505") return res.status(409).json({ error: "Username sudah digunakan." });
      throw err;
    } finally { client.release(); }
  } catch (err) { next(err); }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const result = await pool.query(
      "SELECT u.id,u.username,u.password_hash,w.balance FROM users u JOIN wallets w ON w.user_id=u.id WHERE u.username=$1",
      [username]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Username atau password salah." });
    }
    res.json({
      token: signToken(user),
      user: { id: user.id, username: user.username },
      balance: Number(user.balance)
    });
  } catch (err) { next(err); }
});

app.get("/api/balance", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT balance,updated_at FROM wallets WHERE user_id=$1", [req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Wallet tidak ditemukan." });
    res.json({ balance: Number(result.rows[0].balance), updatedAt: result.rows[0].updated_at });
  } catch (err) { next(err); }
});

app.get("/api/history", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id,bet_amount,win_amount,result,winning_lines,balance_after,created_at
       FROM spin_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ history: result.rows.map(r => ({
      id: r.id, betAmount: Number(r.bet_amount), winAmount: Number(r.win_amount),
      result: r.result, winningLines: r.winning_lines,
      balanceAfter: Number(r.balance_after), createdAt: r.created_at
    })) });
  } catch (err) { next(err); }
});

app.post("/api/spin", requireAuth, async (req, res, next) => {
  const betAmount = Number(req.body.betAmount);
  if (!Number.isSafeInteger(betAmount) || betAmount < 10 || betAmount > 1000) {
    return res.status(400).json({ error: "Taruhan harus bilangan bulat 10–1.000 koin." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const walletResult = await client.query(
      "SELECT balance FROM wallets WHERE user_id=$1 FOR UPDATE", [req.user.id]
    );
    if (!walletResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Wallet tidak ditemukan." });
    }
    const balance = Number(walletResult.rows[0].balance);
    if (balance < betAmount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Saldo koin virtual tidak mencukupi.", balance });
    }

    // Hasil dan pembayaran dihitung di server, dalam transaksi yang sama.
    const spin = createSpin(betAmount);
    const newBalance = balance - betAmount + spin.winAmount;

    await client.query(
      "UPDATE wallets SET balance=$1,updated_at=NOW() WHERE user_id=$2",
      [newBalance, req.user.id]
    );
    const saved = await client.query(
      `INSERT INTO spin_history(user_id,bet_amount,win_amount,result,winning_lines,balance_after)
       VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6) RETURNING id,created_at`,
      [req.user.id, betAmount, spin.winAmount, JSON.stringify(spin.grid),
       JSON.stringify(spin.winningLines), newBalance]
    );
    await client.query("COMMIT");

    res.json({
      success: true, betAmount, winAmount: spin.winAmount,
      balance: newBalance, grid: spin.grid,
      winningLines: spin.winningLines,
      spinId: saved.rows[0].id, createdAt: saved.rows[0].created_at
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally { client.release(); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan server." });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Dragon Kingdom API berjalan di http://localhost:${port}`));
