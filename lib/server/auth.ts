import { cookies } from 'next/headers';
import { db, HttpError, randomToken, sha256 } from './http';

export type Role = 'owner' | 'staff';
export type User = { id: string; email: string; name: string; role: Role; staffId: string | null };

const COOKIE = 'sp_session';
const SESSION_DAYS = 30;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
// O máximo de iterações PBKDF2 suportado pelos Cloudflare Workers.
const PBKDF2_ITERATIONS = 100_000;

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${PBKDF2_ITERATIONS}$${b64(salt)}$${b64(await derive(password, salt, PBKDF2_ITERATIONS))}`;
}

async function verifyPassword(password: string, stored: string) {
  const [scheme, iterations, salt, hash] = stored.split('$');
  if (scheme !== 'pbkdf2') return false;
  const actual = await derive(password, unb64(salt), Number(iterations));
  const expected = unb64(hash);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

export function validatePassword(password: unknown): string {
  if (typeof password !== 'string' || password.length < 10) throw new HttpError(400, 'A password deve ter pelo menos 10 caracteres.');
  if (password.length > 200) throw new HttpError(400, 'Password demasiado longa.');
  return password;
}

export const normalizeEmail = (email: unknown) => (typeof email === 'string' ? email.trim().toLowerCase() : '');
export const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;

type UserRow = { id: string; email: string; name: string; role: Role; staff_id: string | null; password_hash: string; active: number; failed_logins: number; locked_until: number | null };
const toUser = (r: UserRow): User => ({ id: r.id, email: r.email, name: r.name, role: r.role, staffId: r.staff_id });

/** Valida credenciais; bloqueia a conta 15 min após 5 tentativas falhadas. */
export async function login(emailInput: unknown, password: unknown): Promise<User> {
  const email = normalizeEmail(emailInput);
  const fail = new HttpError(401, 'Email ou password incorretos.');
  if (!email || typeof password !== 'string') throw fail;
  const row = await db().prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
  if (!row || !row.active) {
    await hashPassword('tempo-constante'); // evita revelar pelo tempo de resposta se o email existe
    throw fail;
  }
  if (row.locked_until && row.locked_until > Date.now()) {
    throw new HttpError(429, 'Demasiadas tentativas. Tente novamente dentro de alguns minutos.');
  }
  if (!(await verifyPassword(password, row.password_hash))) {
    const failed = row.failed_logins + 1;
    const lock = failed >= MAX_FAILED_LOGINS ? Date.now() + LOCK_MINUTES * 60_000 : null;
    await db().prepare('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?').bind(lock ? 0 : failed, lock, row.id).run();
    throw fail;
  }
  await db().prepare('UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?').bind(row.id).run();
  return toUser(row);
}

function cookieHeader(request: Request, value: string, maxAge: number) {
  const host = new URL(request.url).hostname;
  const secure = host === 'localhost' || host === '127.0.0.1' ? '' : '; Secure';
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

/** Cria uma sessão e devolve o cabeçalho Set-Cookie. */
export async function startSession(request: Request, userId: string) {
  const token = randomToken();
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  await db().batch([
    db().prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()),
    db().prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), userId, expires),
  ]);
  return cookieHeader(request, token, SESSION_DAYS * 86_400);
}

export async function endSession(request: Request) {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token) await db().prepare('DELETE FROM sessions WHERE id = ?').bind(await sha256(token)).run();
  return cookieHeader(request, '', 0);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = await db()
    .prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ? AND u.active = 1')
    .bind(await sha256(token), Date.now())
    .first<UserRow>();
  return row ? toUser(row) : null;
}

export async function requireUser(role?: Role): Promise<User> {
  const user = await currentUser();
  if (!user) throw new HttpError(401, 'Sessão terminada. Entre novamente.');
  if (role && user.role !== role) throw new HttpError(403, 'Sem permissão.');
  return user;
}

/** Profissionais cuja agenda o utilizador pode ver e alterar (null = todos). */
export const visibleStaff = (user: User) => (user.role === 'owner' ? null : user.staffId ? [user.staffId] : []);

export function assertCanManage(user: User, staffId: string) {
  const allowed = visibleStaff(user);
  if (allowed && !allowed.includes(staffId)) throw new HttpError(403, 'Só pode gerir a sua própria agenda.');
}

export async function countUsers() {
  return (await db().prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>())?.n ?? 0;
}

export async function revokeSessions(userId: string, exceptToken?: string) {
  if (exceptToken) {
    await db().prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').bind(userId, await sha256(exceptToken)).run();
  } else {
    await db().prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
  }
}

export async function currentToken() {
  return (await cookies()).get(COOKIE)?.value;
}

export async function changePassword(user: User, current: unknown, next: unknown) {
  const row = await db().prepare('SELECT password_hash FROM users WHERE id = ?').bind(user.id).first<{ password_hash: string }>();
  if (!row || typeof current !== 'string' || !(await verifyPassword(current, row.password_hash))) {
    throw new HttpError(400, 'A password atual está incorreta.');
  }
  await db().prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(validatePassword(next)), user.id).run();
  await revokeSessions(user.id, await currentToken());
}
