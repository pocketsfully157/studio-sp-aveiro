'use client';

import type { ReactNode } from 'react';
import { CalendarDays, ExternalLink, KeyRound, LogOut, Users } from 'lucide-react';
import { findStaff, salon } from '../../lib/config';
import type { User } from '../../lib/server/auth';
import { api } from '../modal';

export function AdminShell({ user, active, children }: { user: User; active: 'agenda' | 'equipa' | 'conta'; children: ReactNode }) {
  const link = (key: typeof active, href: string, icon: ReactNode, label: string) => (
    <a href={href} className={active === key ? 'side-active' : 'side-link'} aria-current={active === key ? 'page' : undefined}>{icon} {label}</a>
  );
  async function logout() {
    await api('/api/auth/logout', {}).catch(() => {});
    location.href = '/entrar';
  }
  return (
    <div className='workspace'>
      <aside>
        <a className='brand' href='/gestao'>STUDIO <strong>SP</strong><small>{salon.tagline.toUpperCase()}</small></a>
        <div className='side-label'>GESTÃO</div>
        <nav className='side-nav'>
          {link('agenda', '/gestao', <CalendarDays size={19} />, 'Agenda')}
          {user.role === 'owner' && link('equipa', '/gestao/equipa', <Users size={19} />, 'Equipa e acessos')}
          {link('conta', '/gestao/conta', <KeyRound size={19} />, 'A minha conta')}
          <a className='side-link' href='/' target='_blank'><ExternalLink size={18} /> Ver site</a>
        </nav>
        <div className='side-bottom'>
          <div className='avatar'>{user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
          <div>{user.name}<small>{user.role === 'owner' ? 'Gerência' : findStaff(user.staffId ?? '')?.role ?? 'Equipa'}</small></div>
          <button className='icon-button' aria-label='Sair' title='Sair' onClick={logout}><LogOut size={17} /></button>
        </div>
      </aside>
      <main className='dashboard'>{children}</main>
    </div>
  );
}
