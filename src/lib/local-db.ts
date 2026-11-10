import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

let active: DatabaseSync | null = null;

/**
 * An on-disk database owned by this Node.js server.
 * Production MUST mount a durable volume and set MIM_DATABASE_PATH.
 * Never use /tmp or an ephemeral serverless filesystem for user accounts.
 */
export function database(): DatabaseSync {
  if (process.env.VERCEL) throw new Error("Local SQLite accounts require a persistent, self-hosted Node server.");
  const location = process.env.MIM_DATABASE_PATH;
  if (!location || !path.isAbsolute(location)) {
    throw new Error("MIM_DATABASE_PATH must point to a durable, absolute SQLite path.");
  }
  if (active) return active;
  mkdirSync(path.dirname(location), { recursive: true, mode: 0o700 });
  const connection = new DatabaseSync(location);
  connection.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS session_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      scope TEXT NOT NULL CHECK(scope IN ('user', 'recovery')),
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_by_user ON session_tokens(user_id);
    CREATE TABLE IF NOT EXISTS otp_challenges (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      purpose TEXT NOT NULL CHECK(purpose IN ('signup','recovery')),
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      sent_at INTEGER NOT NULL,
      window_start INTEGER NOT NULL,
      sends INTEGER NOT NULL DEFAULT 1,
      attempts INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(user_id,purpose)
    );
    CREATE TABLE IF NOT EXISTS login_attempts (
      key TEXT PRIMARY KEY,
      failures INTEGER NOT NULL,
      window_start INTEGER NOT NULL,
      blocked_until INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rate_buckets (
      bucket TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS template_likes (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      template_key TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY(user_id,template_key)
    );
    CREATE INDEX IF NOT EXISTS likes_by_template ON template_likes(template_key);
    CREATE TABLE IF NOT EXISTS template_like_revisions (
      template_key TEXT PRIMARY KEY,
      revision INTEGER NOT NULL DEFAULT 0
    );
  `);
  active = connection;
  return connection;
}

export function transaction<T>(fn: () => T): T {
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const value = fn();
    db.exec("COMMIT");
    return value;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
