import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Account } from '../../../components/admin/account';
import { AdminShell } from '../../../components/admin/shell';
import { currentUser } from '../../../lib/server/auth';

export const metadata: Metadata = { title: 'A minha conta | STUDIO SP', robots: { index: false } };

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect('/entrar');
  return <AdminShell user={user} active='conta'><Account user={user} /></AdminShell>;
}
