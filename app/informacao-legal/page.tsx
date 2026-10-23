import type { Metadata } from 'next';
import Link from 'next/link';
import { legal, salon } from '../../lib/config';

export const metadata: Metadata = { title: 'Informação legal | STUDIO SP' };

export default function Page() {
  return (
    <main className='legal'>
      <Link className='brand' href='/'>STUDIO <strong>SP</strong></Link>
      <h1>Informação legal</h1>
      <h2>Identificação</h2>
      <p>{salon.legalName}<br />NIF {salon.nif}<br />{salon.address}<br />{salon.phone} · {salon.email}</p>
      <h2>Livro de Reclamações</h2>
      <p>
        Pode apresentar uma reclamação no{' '}
        <a className='inline' href={legal.complaintsBookUrl} target='_blank' rel='noreferrer'>Livro de Reclamações Eletrónico</a>{' '}
        ou pedir o livro em papel no salão.
      </p>
      <h2>Resolução alternativa de litígios</h2>
      <p>
        Em caso de litígio de consumo, o consumidor pode recorrer à seguinte entidade de resolução alternativa de litígios:{' '}
        <a className='inline' href={legal.disputeResolution.url} target='_blank' rel='noreferrer'>{legal.disputeResolution.name}</a>.
      </p>
      <p>
        Mais informações no{' '}
        <a className='inline' href={legal.consumerPortalUrl} target='_blank' rel='noreferrer'>Portal do Consumidor</a>.
      </p>
      <h2>Dados pessoais</h2>
      <p>Consulte a <Link className='inline' href='/privacidade'>Política de Privacidade</Link>.</p>
    </main>
  );
}
