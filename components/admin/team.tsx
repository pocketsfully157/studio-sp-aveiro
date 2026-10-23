'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { findStaff, staff as allStaff } from '../../lib/config';
import type { Role, User } from '../../lib/server/auth';
import { api, Modal } from '../modal';

type Account = { id: string; email: string; name: string; role: Role; staffId: string | null; active: boolean; createdAt: string };

export function Team({ me }: { me: User }) {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Account | 'new' | null>(null);

  useEffect(() => {
    api<{ users: Account[] }>('/api/admin/users').then(r => setAccounts(r.users)).catch(e => setError(e.message));
  }, []);

  const withoutAccount = allStaff.filter(s => !accounts?.some(a => a.staffId === s.id));

  return (
    <>
      <header className='dash-top'>
        <div>
          <div className='eyebrow'>EQUIPA E ACESSOS</div>
          <h1>Quem entra na agenda<span>.</span></h1>
          <p>Cada profissional vê e gere apenas a sua agenda. A gerência vê tudo.</p>
        </div>
        <button className='primary' onClick={() => setEditing('new')}><UserPlus size={18} /> Nova conta</button>
      </header>

      {error && <p className='form-error' role='alert'>{error}</p>}
      <section className='calendar-panel table-panel'>
        <table className='accounts'>
          <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Agenda</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {accounts === null ? <tr><td colSpan={6}>A carregar…</td></tr> : accounts.map(a => (
              <tr key={a.id} className={a.active ? '' : 'inactive'}>
                <td><strong>{a.name}</strong>{a.id === me.id && <small> (eu)</small>}</td>
                <td>{a.email}</td>
                <td>{a.role === 'owner' ? 'Gerência' : 'Profissional'}</td>
                <td>{a.staffId ? findStaff(a.staffId)?.name ?? a.staffId : a.role === 'owner' ? 'Todas' : '—'}</td>
                <td>{a.active ? 'Ativa' : 'Desativada'}</td>
                <td><button className='text-button' onClick={() => setEditing(a)}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {accounts && withoutAccount.length > 0 && (
        <p className='fine-print left'>Sem conta: {withoutAccount.map(s => s.name).join(', ')}.</p>
      )}
      <p className='fine-print left'>Para adicionar profissionais ou serviços à agenda, edite <code>lib/config.ts</code>.</p>

      {editing && (
        <AccountForm account={editing === 'new' ? null : editing} me={me}
          onClose={() => setEditing(null)}
          onSaved={users => { setAccounts(users); setEditing(null); }} />
      )}
    </>
  );
}

function AccountForm({ account, me, onClose, onSaved }: {
  account: Account | null;
  me: User;
  onClose: () => void;
  onSaved: (users: Account[]) => void;
}) {
  const [role, setRole] = useState<Role>(account?.role ?? 'staff');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const self = account?.id === me.id;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    setError('');
    try {
      const r = await api<{ users: Account[] }>('/api/admin/users', account
        ? { action: 'update', id: account.id, role, staffId: f.staffId || null, active: f.active === 'on' || self, password: f.password || undefined }
        : { action: 'create', name: f.name, email: f.email, role, staffId: f.staffId || null, password: f.password });
      onSaved(r.users);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} label='Conta' eyebrow='EQUIPA E ACESSOS'>
      <form onSubmit={submit}>
        <h2>{account ? account.name : 'Nova conta'}</h2>
        {!account && (
          <>
            <label>Nome<input name='name' required maxLength={80} /></label>
            <label>Email<input name='email' type='email' required /></label>
          </>
        )}
        <div className='form-grid'>
          <label>Perfil
            <select value={role} onChange={e => setRole(e.target.value as Role)} disabled={self}>
              <option value='staff'>Profissional</option>
              <option value='owner'>Gerência</option>
            </select>
          </label>
          <label>Agenda
            <select name='staffId' defaultValue={account?.staffId ?? ''} required={role === 'staff'}>
              <option value=''>{role === 'owner' ? 'Nenhuma (só gestão)' : 'Escolher…'}</option>
              {allStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        </div>
        <label>{account ? 'Nova password (deixe vazio para manter)' : 'Password inicial (mín. 10 caracteres)'}
          <input name='password' type='password' minLength={10} required={!account} autoComplete='new-password' />
        </label>
        {account && !self && (
          <label className='check'><input type='checkbox' name='active' defaultChecked={account.active} /><span>Conta ativa</span></label>
        )}
        <p className='fine-print left'>Partilhe a password inicial pessoalmente; a pessoa pode alterá-la em «A minha conta».</p>
        {error && <p className='form-error' role='alert'>{error}</p>}
        <button className='primary wide spaced' disabled={busy}>{busy ? 'A guardar…' : 'Guardar'}</button>
      </form>
    </Modal>
  );
}
