import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { AdminShell } from '../../../components/admin/shell';
import { Team } from '../../../components/admin/team';
import { currentUser } from '../../../lib/server/auth';

export const metadata: Metadata = { title: 'Equipa | STUDIO SP', robots: { index: false } };

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect('/entrar');
  if (user.role !== 'owner') redirect('/gestao');
  return <AdminShell user={user} active='equipa'><Team me={user} /></AdminShell>;
}
