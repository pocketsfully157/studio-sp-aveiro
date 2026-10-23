import { endSession } from '../../../../lib/server/auth';
import { json, route } from '../../../../lib/server/http';

export const POST = route(async request => json({ ok: true }, { headers: { 'Set-Cookie': await endSession(request) } }));
