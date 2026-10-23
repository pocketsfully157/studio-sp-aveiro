'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { api } from '../modal';
import Link from 'next/link';

function AuthCard({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <main className='auth-page'>
      <div className='auth-card'>
        <Link className='brand' href='/'>STUDIO <strong>SP</strong><small>ÁREA DA EQUIPA</small></Link>
        <h1>{title}</h1>
        <p className='modal-intro'>{intro}</p>
        {children}
      </div>
    </main>
  );
}

function useSubmit(url: string, redirect: string) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(url, Object.fromEntries(new FormData(e.currentTarget)));
      location.href = redirect;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }
  return { error, busy, onSubmit };
}

export function LoginForm({ needsSetup }: { needsSetup: boolean }) {
  const { error, busy, onSubmit } = useSubmit('/api/auth/login', '/gestao');
  return (
    <AuthCard title='Entrar' intro='Acesso reservado à equipa do salão.'>
      <form onSubmit={onSubmit}>
        <label>Email<input name='email' type='email' autoComplete='username' required /></label>
        <label>Password<input name='password' type='password' autoComplete='current-password' required /></label>
        {error && <p className='form-error' role='alert'>{error}</p>}
        <button className='primary wide spaced' disabled={busy}>{busy ? 'A entrar…' : 'Entrar'}</button>
      </form>
      {needsSetup && <p className='fine-print'>Primeira utilização? <a className='inline' href='/configurar'>Criar a conta de gerência</a></p>}
      <p className='fine-print'>Esqueceu a password? Peça à gerência para a redefinir.</p>
    </AuthCard>
  );
}

export function SetupForm() {
  const { error, busy, onSubmit } = useSubmit('/api/auth/setup', '/gestao/equipa');
  return (
    <AuthCard title='Configuração inicial' intro='Crie a conta da gerência. Depois poderá criar as contas da equipa.'>
      <form onSubmit={onSubmit}>
        <label>Código de configuração<input name='token' type='password' required autoComplete='off' /></label>
        <label>Nome<input name='name' required autoComplete='name' /></label>
        <label>Email<input name='email' type='email' required autoComplete='username' /></label>
        <label>Password (mín. 10 caracteres)<input name='password' type='password' minLength={10} required autoComplete='new-password' /></label>
        {error && <p className='form-error' role='alert'>{error}</p>}
        <button className='primary wide spaced' disabled={busy}>{busy ? 'A criar…' : 'Criar conta'}</button>
      </form>
    </AuthCard>
  );
}
