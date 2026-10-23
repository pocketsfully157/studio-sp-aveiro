import { env } from 'cloudflare:workers';

export const db = () => env.DB;

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const json = (data: unknown, init: ResponseInit = {}) =>
  Response.json(data, { ...init, headers: { 'Cache-Control': 'no-store', ...init.headers } });

export async function readJson<T>(request: Request): Promise<Partial<T>> {
  try {
    const body = await request.json();
    if (body && typeof body === 'object') return body as Partial<T>;
  } catch {}
  throw new HttpError(400, 'Pedido inválido.');
}

/** Recusa pedidos de escrita vindos de outros sites (proteção CSRF além do SameSite). */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, 'Origem não permitida.');
}

/** Envolve um handler: converte HttpError em respostas JSON e regista erros inesperados. */
export function route(fn: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      if (request.method !== 'GET') assertSameOrigin(request);
      return await fn(request);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, { status: e.status });
      console.error(e);
      return json({ error: 'Ocorreu um erro inesperado. Tente novamente.' }, { status: 500 });
    }
  };
}

export const randomToken = (bytes = 32) => {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
