import type { Metadata } from 'next';
import { salon } from '../../lib/config';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Política de Privacidade | STUDIO SP' };

// MODELO: rever com o salão (e, idealmente, com apoio jurídico) antes de publicar.
export default function Page() {
  return (
    <main className='legal'>
      <Link className='brand' href='/'>STUDIO <strong>SP</strong></Link>
      <h1>Política de Privacidade</h1>
      <p><strong>Responsável pelo tratamento:</strong> {salon.legalName}, NIF {salon.nif}, {salon.address}. Contacto: {salon.email}.</p>
      <h2>Que dados recolhemos</h2>
      <p>Quando faz uma marcação: nome, telemóvel, email (opcional), o serviço, a data e a hora escolhidos e as observações que nos deixar.</p>
      <h2>Para que os usamos</h2>
      <p>Apenas para gerir a sua marcação: confirmá-la, enviar um lembrete antes da data e avisá-la de alterações ou cancelamentos. Não usamos os seus dados para publicidade e não os vendemos.</p>
      <h2>Fundamento</h2>
      <p>Diligências pré-contratuais e execução do serviço que pediu (art.º 6.º, n.º 1, alínea b) do RGPD).</p>
      <h2>Com quem partilhamos</h2>
      <p>Com prestadores que nos ajudam a funcionar, apenas na medida do necessário: alojamento do site e base de dados (Cloudflare), envio de emails (Resend) e de SMS/WhatsApp (Twilio).</p>
      <h2>Durante quanto tempo</h2>
      <p>Guardamos o histórico de marcações durante 2 anos após a última visita, salvo obrigação legal em contrário.</p>
      <h2>Os seus direitos</h2>
      <p>Pode pedir acesso, retificação, apagamento, limitação ou portabilidade dos seus dados, ou opor-se ao tratamento, através de {salon.email}. Tem ainda o direito de apresentar reclamação à Comissão Nacional de Proteção de Dados (www.cnpd.pt).</p>
      <p className='fine-print left'>Última atualização: outubro de 2026.</p>
    </main>
  );
}
