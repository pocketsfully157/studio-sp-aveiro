import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { LoginForm } from '../../components/admin/auth-forms';
import { countUsers, currentUser } from '../../lib/server/auth';

export const metadata: Metadata = { title: 'Entrar | STUDIO SP', robots: { index: false } };

export default async function Page() {
  if (await currentUser()) redirect('/gestao');
  return <LoginForm needsSetup={(await countUsers()) === 0} />;
}
