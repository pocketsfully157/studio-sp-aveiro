import { findStaff } from '../../../../lib/config';
import { hashPassword, isEmail, normalizeEmail, requireUser, revokeSessions, validatePassword, type Role } from '../../../../lib/server/auth';
import { db, HttpError, json, readJson, route } from '../../../../lib/server/http';

type UserRow = { id: string; email: string; name: string; role: Role; staff_id: string | null; active: number; created_at: string };

const list = async () => (await db()
  .prepare('SELECT id, email, name, role, staff_id, active, created_at FROM users ORDER BY role DESC, name')
  .all<UserRow>()).results
  .map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, staffId: u.staff_id, active: !!u.active, createdAt: u.created_at }));

export const GET = route(async () => {
  await requireUser('owner');
  return json({ users: await list() });
});

type Body = { action: 'create' | 'update'; id: string; name: string; email: string; role: Role; staffId: string | null; password: string; active: boolean };

function checkRole(role: unknown, staffId: unknown) {
  if (role !== 'owner' && role !== 'staff') throw new HttpError(400, 'Perfil inválido.');
  if (staffId != null && staffId !== '' && !findStaff(String(staffId))) throw new HttpError(400, 'Profissional inválido.');
  if (role === 'staff' && !staffId) throw new HttpError(400, 'Associe a conta a um profissional.');
  return { role: role as Role, staffId: staffId ? String(staffId) : null };
}

export const POST = route(async request => {
  const me = await requireUser('owner');
  const body = await readJson<Body>(request);

  if (body.action === 'create') {
    const email = normalizeEmail(body.email);
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
    if (!name || !isEmail(email)) throw new HttpError(400, 'Indique nome e email válidos.');
    const { role, staffId } = checkRole(body.role, body.staffId);
    try {
      await db().prepare('INSERT INTO users (id, email, name, role, staff_id, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), email, name, role, staffId, await hashPassword(validatePassword(body.password)), new Date().toISOString()).run();
    } catch (e) {
      if (String(e).includes('UNIQUE')) throw new HttpError(409, 'Já existe uma conta com este email.');
      throw e;
    }
    return json({ users: await list() });
  }

  if (body.action === 'update') {
    const target = (await list()).find(u => u.id === body.id);
    if (!target) throw new HttpError(404, 'Conta não encontrada.');
    const { role, staffId } = checkRole(body.role ?? target.role, body.staffId === undefined ? target.staffId : body.staffId);
    const active = body.active ?? target.active;
    if (target.id === me.id && (role !== 'owner' || !active)) throw new HttpError(400, 'Não pode retirar o acesso de gestão à sua própria conta.');
    const statements = [db().prepare('UPDATE users SET role = ?, staff_id = ?, active = ? WHERE id = ?').bind(role, staffId, active ? 1 : 0, target.id)];
    if (body.password) {
      statements.push(db().prepare('UPDATE users SET password_hash = ?, failed_logins = 0, locked_until = NULL WHERE id = ?')
        .bind(await hashPassword(validatePassword(body.password)), target.id));
    }
    await db().batch(statements);
    if (!active || body.password || role !== target.role || staffId !== target.staffId) await revokeSessions(target.id);
    return json({ users: await list() });
  }

  throw new HttpError(400, 'Ação inválida.');
});
