import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Agenda } from '../../components/admin/agenda';
import { AdminShell } from '../../components/admin/shell';
import { currentUser } from '../../lib/server/auth';

export const metadata: Metadata = { title: 'Agenda | STUDIO SP', robots: { index: false } };

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect('/entrar');
  return <AdminShell user={user} active='agenda'><Agenda user={user} /></AdminShell>;
}
