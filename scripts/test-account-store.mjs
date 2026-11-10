import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const base = mkdtempSync(path.join(tmpdir(), "mim-auth-test-"));
const original = {
 path: process.env.MIM_DATABASE_PATH,
 secret: process.env.MIM_AUTH_SECRET,
};
process.env.MIM_DATABASE_PATH = path.join(base, "accounts.sqlite");
process.env.MIM_AUTH_SECRET = "test-only-long-random-key-never-use-in-production-64chars";

const originalRequire = createRequire(import.meta.url);
const jar = new Map();
const emails = [];
const cache = new Map();

function load(file) {
 const location = path.join(process.cwd(), "src/lib", file);
 if (cache.has(location)) return cache.get(location);
 const source = readFileSync(location, "utf8");
 const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
 }).outputText;
 const module = { exports: {} };
 cache.set(location, module.exports);
 function localRequire(name) {
  if (name === "server-only") return {};
  if (name === "next/headers") return { cookies: async () => ({
   get: key => jar.has(key) ? { value: jar.get(key) } : undefined,
   set: (key,value) => jar.set(key,value),
   delete: key => jar.delete(key),
  }) };
  if (name === "./mim-mail") return {sendVerificationCode: async (email, code, purpose) => {
   emails.push({email,code,purpose});
  }};
  if (name.startsWith("./")) return load(name.slice(2) + ".ts");
  return originalRequire(name);
 }
 const evaluate = new Function("require", "module", "exports", "process", "Buffer", transpiled);
 evaluate(localRequire, module, module.exports, process, Buffer);
 cache.set(location, module.exports);
 return module.exports;
}

try {
 const accounts = load("mim-accounts.ts");
 const db = load("local-db.ts");
 const email = "new-member@example.test";
 const oldPassword = "my-first-very-long-password!2026";
 const newPassword = "a-whole-new-long-password!2026";
 const signup = await accounts.register(email,oldPassword);
 assert.equal(signup,"sent");
 assert.equal(emails.length,1);
 assert.match(emails[0].code,/^[0-9]{6}$/);
 assert.equal(emails[0].purpose,"signup");
 assert.equal(await accounts.verifyChallenge(email,"000000" === emails[0].code ? "999999" : "000000","signup"),false);
 assert.equal(await accounts.finishVerification(email,emails[0].code,"signup"),true);
 assert.equal(await accounts.verifyChallenge(email,emails[0].code,"signup"),false,"OTP cannot be reused");
 let user = await accounts.currentUser();
 assert.equal(user?.email,email);
 assert.equal((db.database().prepare("SELECT password_hash FROM users WHERE email=?").get(email)).password_hash.includes(oldPassword),false);
 const stored = db.database().prepare("SELECT code_hash FROM otp_challenges").all();
 assert.equal(stored.length,0,"consumed OTP should be removed");
 assert.equal(await accounts.signIn(email,"bad-password"),false);
 assert.equal(await accounts.signIn(email,oldPassword),true);
 user=await accounts.currentUser();
 assert.ok(user?.id,"valid password signs in");
 assert.equal(accounts.likeState("image:my-template",user.id).count,0);
 accounts.toggleLike("image:my-template",user.id,true);
 assert.equal(accounts.likeState("image:my-template",user.id).count,1);
 accounts.toggleLike("image:my-template",user.id,true);
 assert.equal(accounts.likeState("image:my-template",user.id).count,1,"likes are idempotent");
 assert.deepEqual(accounts.likedKeys(user.id),["image:my-template"]);
 accounts.toggleLike("image:my-template",user.id,false);
 assert.equal(accounts.likeState("image:my-template",user.id).count,0);
 assert.equal(await accounts.sendChallenge(email,"recovery"),"sent");
 const recovery=emails.findLast(item=>item.purpose==="recovery");
 assert.ok(recovery);
 assert.equal(await accounts.finishVerification(email,recovery.code,"recovery"),true);
 assert.equal(await accounts.currentUser(),null,"recovery code is not an editor login");
 assert.equal((await accounts.readSession())?.scope,"recovery");
 assert.equal(await accounts.changePassword(newPassword),true);
 assert.equal((await accounts.currentUser())?.email,email);
 await accounts.removeSession();
 assert.equal(await accounts.currentUser(),null);
 assert.equal(await accounts.signIn(email,oldPassword),false,"old password should be revoked");
 assert.equal(await accounts.signIn(email,newPassword),true);
 await accounts.removeSession();
 assert.equal(await accounts.currentUser(),null);
 console.log("PASS first-party SQLite: email verification, password hashing, sessions, recovery, and private likes");
} finally {
 if (original.path===undefined) delete process.env.MIM_DATABASE_PATH;
 else process.env.MIM_DATABASE_PATH=original.path;
 if (original.secret===undefined) delete process.env.MIM_AUTH_SECRET;
 else process.env.MIM_AUTH_SECRET=original.secret;
 rmSync(base,{recursive:true,force:true});
}
