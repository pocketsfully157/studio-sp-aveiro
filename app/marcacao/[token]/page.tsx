import type { Metadata } from 'next';
import { ManageBooking } from '../../../components/public/manage-booking';

export const metadata: Metadata = { title: 'A minha marcação | STUDIO SP', robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  return <ManageBooking token={(await params).token} />;
}
