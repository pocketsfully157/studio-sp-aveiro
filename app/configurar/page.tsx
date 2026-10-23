import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { SetupForm } from '../../components/admin/auth-forms';
import { countUsers } from '../../lib/server/auth';

export const metadata: Metadata = { title: 'Configuração | STUDIO SP', robots: { index: false } };

export default async function Page() {
  if ((await countUsers()) > 0) redirect('/entrar');
  return <SetupForm />;
}
