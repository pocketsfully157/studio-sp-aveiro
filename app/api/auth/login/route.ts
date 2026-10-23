import { login, startSession } from '../../../../lib/server/auth';
import { json, readJson, route } from '../../../../lib/server/http';

export const POST = route(async request => {
  const body = await readJson<{ email: string; password: string }>(request);
  const user = await login(body.email, body.password);
  return json({ user }, { headers: { 'Set-Cookie': await startSession(request, user.id) } });
});
