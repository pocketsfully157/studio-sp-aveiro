'use client';

import { useState, type FormEvent } from 'react';
import type { User } from '../../lib/server/auth';
import { api } from '../modal';

export function Account({ user }: { user: User }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const f = Object.fromEntries(new FormData(formEl)) as Record<string, string>;
    if (f.next !== f.repeat) return setMessage({ ok: false, text: 'As novas passwords não coincidem.' });
    setBusy(true);
    setMessage(null);
    try {
      await api('/api/auth/password', { current: f.current, next: f.next });
      formEl.reset();
      setMessage({ ok: true, text: 'Password alterada. As outras sessões abertas foram terminadas.' });
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className='dash-top'>
        <div>
          <div className='eyebrow'>A MINHA CONTA</div>
          <h1>{user.name}<span>.</span></h1>
          <p>{user.email}</p>
        </div>
      </header>
      <section className='calendar-panel narrow-panel'>
        <form onSubmit={submit}>
          <h3>Alterar password</h3>
          <label>Password atual<input name='current' type='password' required autoComplete='current-password' /></label>
          <label>Nova password (mín. 10 caracteres)<input name='next' type='password' minLength={10} required autoComplete='new-password' /></label>
          <label>Repetir nova password<input name='repeat' type='password' minLength={10} required autoComplete='new-password' /></label>
          {message && <p className={message.ok ? 'form-ok' : 'form-error'} role='status'>{message.text}</p>}
          <button className='primary spaced' disabled={busy}>{busy ? 'A guardar…' : 'Alterar password'}</button>
        </form>
      </section>
    </>
  );
}
