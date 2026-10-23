import type { Metadata } from 'next';
import Presentation from '../../components/presentation';
import './presentation.css';

export const metadata: Metadata = {
  title: 'STUDIO SP — Uma agenda em harmonia',
  description: 'Uma apresentação animada da experiência de marcação e gestão do STUDIO SP.',
  robots: { index: false },
};

export default function PresentationPage() {
  return <Presentation />;
}
