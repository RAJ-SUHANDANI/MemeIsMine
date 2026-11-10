import "server-only";
import { createHash, createHmac, randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { authConfig } from "./auth-config";
import { database, transaction } from "./local-db";
import { sendVerificationCode } from "./mim-mail";

const COOKIE = "mim_session";
const PENDING = "mim_verify";
const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

type UserRow = { id: string; email: string; password_hash: string; verified: number };
type ChallengeRow = { code_hash: string; expires_at: number; attempts: number; sent_at: number; window_start: number; sends: number };
type SessionRow = { id: string; email: string; verified: number; scope: "user" | "recovery"; token_hash: string; expires_at: number };
type LoginRow = { failures: number; window_start: number; blocked_until: number };
export type MIMUser = { id: string; email: string };

export function normalizedEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || email.length < 5 || /[\s\r\n]/.test(email) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
  return email;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
function hmac(value: string): string {
  const config = authConfig();
  if (!config) throw new Error("Authentication is not configured");
  return createHmac("sha256", config.secret).update(value).digest("hex");
}
function passwordHash(password: string): string {
  const salt = randomBytes(24);
  return "scrypt:v1:" + salt.toString("hex") + ":" +
    scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 }).toString("hex");
}
function matchesPassword(password: string, existing: string): boolean {
  const parts = existing.split(":");
  if (parts.length !== 4 || parts[0] !== "scrypt" || parts[1] !== "v1") return false;
  try {
    const salt = Buffer.from(parts[2], "hex");
    const expected = Buffer.from(parts[3], "hex");
    if (salt.length !== 24 || expected.length !== 64) return false;
    const actual = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 });
    return timingSafeEqual(actual, expected);
  } catch { return false; }
}
function getUser(email: string): UserRow | undefined {
  return database().prepare("SELECT id,email,password_hash,verified FROM users WHERE email=?").get(email) as UserRow | undefined;
}
function attemptKey(email: string) { return hmac("login:" + email); }
function limited(email: string): boolean {
  const entry = database().prepare("SELECT failures,window_start,blocked_until FROM login_attempts WHERE key=?").get(attemptKey(email)) as LoginRow | undefined;
  return Boolean(entry && entry.blocked_until > Date.now());
}
function recordFailure(email: string) {
  const key = attemptKey(email);
  const now = Date.now();
  const previous = database().prepare("SELECT failures,window_start,blocked_until FROM login_attempts WHERE key=?").get(key) as LoginRow | undefined;
  const windowStart = previous && now - previous.window_start < 15 * 60 * 1000 ? previous.window_start : now;
  const count = previous && windowStart === previous.window_start ? previous.failures + 1 : 1;
  database().prepare("INSERT INTO login_attempts(key,failures,window_start,blocked_until) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET failures=excluded.failures,window_start=excluded.window_start,blocked_until=excluded.blocked_until")
    .run(key,count,windowStart,count >= 7 ? now + 15 * 60 * 1000 : 0);
}
function clearFailures(email: string) {
  database().prepare("DELETE FROM login_attempts WHERE key=?").run(attemptKey(email));
}

/**
 * An atomic, persistent throttle. Keys are HMAC digests rather than raw IPs.
 * A trusted reverse proxy must overwrite X-Real-IP before passing requests.
 */
export function allowRequest(action:string,identifier:string,max:number,windowMs:number):boolean {
  if(!authConfig())return false;
  const key=hmac("rate:"+action+":"+identifier.slice(0,80));
  return transaction(()=>{
    const now=Date.now();
    const row=database().prepare("SELECT attempts,expires_at FROM rate_buckets WHERE bucket=?")
      .get(key) as {attempts:number;expires_at:number}|undefined;
    if(!row||row.expires_at<=now) {
      database().prepare("INSERT INTO rate_buckets(bucket,attempts,expires_at) VALUES(?,?,?) ON CONFLICT(bucket) DO UPDATE SET attempts=1,expires_at=excluded.expires_at")
        .run(key,1,now+windowMs);
      return true;
    }
    if(row.attempts>=max)return false;
    database().prepare("UPDATE rate_buckets SET attempts=attempts+1 WHERE bucket=?").run(key);
    return true;
  });
}

export async function createSession(userId: string, scope: "user" | "recovery" = "user") {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const expiresAt = now + (scope === "recovery" ? TEN_MINUTES : THIRTY_DAYS);
  database().prepare("INSERT INTO session_tokens(token_hash,user_id,scope,expires_at,created_at) VALUES(?,?,?,?,?)")
    .run(hash(token),userId,scope,expiresAt,now);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", expires: new Date(expiresAt),
  });
}
export async function readSession(): Promise<SessionRow | null> {
  if (!authConfig()) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const current = database().prepare(`
    SELECT users.id,users.email,users.verified,sessions.scope,sessions.token_hash,sessions.expires_at
    FROM session_tokens sessions JOIN users ON users.id=sessions.user_id
    WHERE sessions.token_hash=?`).get(hash(token)) as SessionRow | undefined;
  if (!current || current.expires_at <= Date.now() || !current.verified) return null;
  return current;
}
export async function currentUser(): Promise<MIMUser | null> {
  const current = await readSession();
  return current?.scope === "user" ? { id: current.id, email: current.email } : null;
}
export async function removeSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token && authConfig()) database().prepare("DELETE FROM session_tokens WHERE token_hash=?").run(hash(token));
  (await cookies()).delete(COOKIE);
}

export async function sendChallenge(email: string, purpose: "signup" | "recovery"): Promise<"sent" | "cooldown" | "limited" | "unavailable"> {
  if (!authConfig()) return "unavailable";
  const user = getUser(email);
  if (!user) return "sent"; // Recovery must not reveal account existence.
  if (purpose === "signup" && user.verified) return "sent";
  const db = database();
  const previous = db.prepare("SELECT code_hash,expires_at,attempts,sent_at,window_start,sends FROM otp_challenges WHERE user_id=? AND purpose=?")
    .get(user.id,purpose) as ChallengeRow | undefined;
  const now = Date.now();
  if (previous && now - previous.sent_at < 60 * 1000) return "cooldown";
  if (previous && now - previous.window_start < 60 * 60 * 1000 && previous.sends >= 5) return "limited";
  const code = String(randomInt(0,1_000_000)).padStart(6,"0");
  const codeHash = hmac("otp:" + user.id + ":" + purpose + ":" + code);
  const windowStart = previous && now - previous.window_start < 60 * 60 * 1000 ? previous.window_start : now;
  const sends = previous && windowStart === previous.window_start ? previous.sends + 1 : 1;
  db.prepare(`INSERT INTO otp_challenges(user_id,purpose,code_hash,expires_at,sent_at,window_start,sends,attempts)
    VALUES(?,?,?,?,?,?,?,0) ON CONFLICT(user_id,purpose) DO UPDATE SET
    code_hash=excluded.code_hash,expires_at=excluded.expires_at,sent_at=excluded.sent_at,
    window_start=excluded.window_start,sends=excluded.sends,attempts=0`)
    .run(user.id,purpose,codeHash,now+TEN_MINUTES,now,windowStart,sends);
  try {
    await sendVerificationCode(user.email,code,purpose);
    return "sent";
  } catch(error) {
    console.error("OTP email delivery failed:", error instanceof Error ? error.message : "unknown transport error");
    db.prepare("DELETE FROM otp_challenges WHERE user_id=? AND purpose=? AND code_hash=?").run(user.id,purpose,codeHash);
    return "unavailable";
  }
}

export async function register(email: string, password: string): Promise<"sent" | "cooldown" | "limited" | "unavailable" | "exists" | "invalid"> {
  if (!authConfig() || password.length < 12 || password.length > 128) return "unavailable";
  const existing = getUser(email);
  if (!existing) {
    database().prepare("INSERT OR IGNORE INTO users(id,email,password_hash,verified,created_at) VALUES(?,?,?,?,?)")
      .run(randomUUID(),email,passwordHash(password),0,Date.now());
  } else if (existing.verified) {
    return "exists";
  } else if (!matchesPassword(password,existing.password_hash)) {
    return "invalid";
  }
  return sendChallenge(email,"signup");
}

export async function verifyChallenge(email: string, code: string, purpose: "signup" | "recovery"): Promise<boolean> {
  if (!authConfig() || !/^\d{6}$/.test(code)) return false;
  const user = getUser(email);
  if (!user) return false;
  return transaction(()=>{
    const challenge = database().prepare("SELECT code_hash,expires_at,attempts,sent_at,window_start,sends FROM otp_challenges WHERE user_id=? AND purpose=?")
      .get(user.id,purpose) as ChallengeRow | undefined;
    if (!challenge || challenge.expires_at < Date.now() || challenge.attempts >= 5) return false;
    database().prepare("UPDATE otp_challenges SET attempts=attempts+1 WHERE user_id=? AND purpose=?").run(user.id,purpose);
    const expected=Buffer.from(challenge.code_hash,"hex");
    const actual=Buffer.from(hmac("otp:" + user.id + ":" + purpose + ":" + code),"hex");
    if (expected.length !== actual.length || !timingSafeEqual(expected,actual)) return false;
    database().prepare("DELETE FROM otp_challenges WHERE user_id=? AND purpose=?").run(user.id,purpose);
    database().prepare("UPDATE users SET verified=1 WHERE id=?").run(user.id);
    return true;
  });
}

export async function signIn(email: string, password: string): Promise<boolean> {
  if (!authConfig() || limited(email)) return false;
  const user = getUser(email);
  // Always perform a password hash even when the account doesn't exist.
  const fallback = "scrypt:v1:"+"0".repeat(48)+":"+"0".repeat(128);
  const correct = matchesPassword(password,user?.password_hash ?? fallback);
  if (!user || !user.verified || !correct) { recordFailure(email); return false; }
  clearFailures(email);
  await createSession(user.id);
  return true;
}

export async function finishVerification(email:string, code:string, purpose:"signup"|"recovery"): Promise<boolean> {
  if (!(await verifyChallenge(email,code,purpose))) return false;
  const user = getUser(email);
  if (!user) return false;
  await createSession(user.id,purpose==="recovery"?"recovery":"user");
  (await cookies()).delete(PENDING);
  return true;
}
export async function savePending(email:string,purpose:"signup"|"recovery") {
  (await cookies()).set(PENDING,Buffer.from(JSON.stringify({email,purpose})).toString("base64url"),{
    httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:600,
  });
}
export async function pendingVerification():Promise<{email:string;purpose:"signup"|"recovery"}|null> {
  const value=(await cookies()).get(PENDING)?.value;
  if(!value)return null;
  try{
    const decoded:unknown=JSON.parse(Buffer.from(value,"base64url").toString("utf8"));
    if(!decoded || typeof decoded!=="object" || !("email" in decoded) || !("purpose" in decoded))return null;
    if(typeof decoded.email!=="string" || (decoded.purpose!=="signup"&&decoded.purpose!=="recovery"))return null;
    const email=normalizedEmail(decoded.email);
    return email?{email,purpose:decoded.purpose}:null;
  }catch{return null;}
}

export async function changePassword(password:string):Promise<boolean> {
  const current=await readSession();
  if(!current || password.length<12 || password.length>128) return false;
  const digest=passwordHash(password);
  transaction(()=>{
    database().prepare("UPDATE users SET password_hash=? WHERE id=?").run(digest,current.id);
    database().prepare("DELETE FROM session_tokens WHERE user_id=?").run(current.id);
  });
  await createSession(current.id,"user");
  return true;
}

export function likeState(key:string, userId?:string) {
  const db=database();
  const count=(db.prepare("SELECT COUNT(*) AS count FROM template_likes WHERE template_key=?").get(key) as {count:number}).count;
  const rev=db.prepare("SELECT revision FROM template_like_revisions WHERE template_key=?").get(key) as {revision:number}|undefined;
  const liked=userId?Boolean(db.prepare("SELECT 1 FROM template_likes WHERE user_id=? AND template_key=?").get(userId,key)):false;
  return {key,count,revision:rev?.revision??0,liked,signedIn:Boolean(userId)};
}
export function toggleLike(key:string,userId:string,liked:boolean) {
  return transaction(()=>{
    const db=database();
    const existing=Boolean(db.prepare("SELECT 1 FROM template_likes WHERE user_id=? AND template_key=?").get(userId,key));
    if(existing!==liked){
      if(liked)db.prepare("INSERT INTO template_likes(user_id,template_key,created_at) VALUES(?,?,?)").run(userId,key,Date.now());
      else db.prepare("DELETE FROM template_likes WHERE user_id=? AND template_key=?").run(userId,key);
      db.prepare("INSERT INTO template_like_revisions(template_key,revision) VALUES(?,1) ON CONFLICT(template_key) DO UPDATE SET revision=revision+1").run(key);
    }
    return likeState(key,userId);
  });
}
export function likedKeys(userId:string):string[] {
  return (database().prepare("SELECT template_key FROM template_likes WHERE user_id=? ORDER BY created_at DESC LIMIT 1000").all(userId) as {template_key:string}[]).map(x=>x.template_key);
}
