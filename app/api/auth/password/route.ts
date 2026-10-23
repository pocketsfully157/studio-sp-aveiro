import { changePassword, requireUser } from '../../../../lib/server/auth';
import { json, readJson, route } from '../../../../lib/server/http';

export const POST = route(async request => {
  const user = await requireUser();
  const body = await readJson<{ current: string; next: string }>(request);
  await changePassword(user, body.current, body.next);
  return json({ ok: true });
});
