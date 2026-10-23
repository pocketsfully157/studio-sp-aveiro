import { env } from 'cloudflare:workers';
import { countUsers, hashPassword, isEmail, normalizeEmail, startSession, validatePassword } from '../../../../lib/server/auth';
import { db, HttpError, json, readJson, route } from '../../../../lib/server/http';

/** Cria a primeira conta (gerência). Só funciona enquanto não existir nenhuma conta e com o SETUP_TOKEN certo. */
export const POST = route(async request => {
  const body = await readJson<{ token: string; name: string; email: string; password: string }>(request);
  if (!env.SETUP_TOKEN) throw new HttpError(503, 'Configure a variável SETUP_TOKEN antes de criar a primeira conta.');
  if (body.token !== env.SETUP_TOKEN) throw new HttpError(403, 'Código de configuração incorreto.');
  if ((await countUsers()) > 0) throw new HttpError(409, 'A conta de gestão já foi criada. Use a página de entrada.');
  const email = normalizeEmail(body.email);
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
  if (!name || !isEmail(email)) throw new HttpError(400, 'Indique nome e email válidos.');
  const id = crypto.randomUUID();
  await db().prepare('INSERT INTO users (id, email, name, role, staff_id, password_hash, created_at) VALUES (?, ?, ?, ?, NULL, ?, ?)')
    .bind(id, email, name, 'owner', await hashPassword(validatePassword(body.password)), new Date().toISOString()).run();
  return json({ ok: true }, { headers: { 'Set-Cookie': await startSession(request, id) } });
});
