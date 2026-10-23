'use client';

import { useState } from 'react';
import { Clock, MapPin, Phone, Plus, Scissors } from 'lucide-react';
import { openingHours, salon, services, staff } from '../../lib/config';
import { time } from '../../lib/time';
import { BookingDialog } from './booking-dialog';
import Link from 'next/link';

const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const initials = (name: string) => name.split(' ').map(n => n[0]).join('');

export default function PublicSite() {
  // Cada abertura monta um formulário novo (estado limpo).
  const [booking, setBooking] = useState<{ n: number; service?: string } | null>(null);
  const book = (service?: string) => setBooking(b => ({ n: (b?.n ?? 0) + 1, service }));

  return (
    <>
      <nav className='public-nav'>
        <Link className='brand' href='/'>STUDIO <strong>SP</strong><small>{salon.tagline.toUpperCase()}</small></Link>
        <div><a href='#servicos'>Serviços</a><a href='#equipa'>Equipa</a><a href='#visita'>Contactos</a></div>
        <button className='primary' onClick={() => book()}>Marcar agora</button>
      </nav>
      <main>
        <section className='hero'>
          <div className='hero-copy'>
            <div className='eyebrow'>O SEU MOMENTO, EM AVEIRO</div>
            <h1>O cuidado<br />que se sente.<br /><em>A beleza que fica.</em></h1>
            <p>Cabelo, estética, manicura e massagens.<br />Um espaço para abrandar e cuidar de si.</p>
            <button className='primary' onClick={() => book()}>Reserve o seu momento</button>
            <div className='hero-detail'><span>01 /</span> Marcação online, confirmação imediata.</div>
          </div>
          <div className='hero-photo'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src='/salon.jpg' alt='Interior do salão com cadeiras bordeaux' />
            <div className='photo-caption'>BELEZA COM TEMPO PARA SI</div>
          </div>
        </section>

        <section className='services-section' id='servicos'>
          <div className='section-title'>
            <div><div className='eyebrow'>CUIDADOS À SUA MEDIDA</div><h2>Escolha o seu momento.</h2></div>
            <p>Escolha um serviço para ver<br />os horários livres.</p>
          </div>
          <div className='services-grid'>
            {services.map((s, i) => (
              <button className='service-card' key={s.id} onClick={() => book(s.id)}>
                <div className='service-number'>{String(i + 1).padStart(2, '0')}<span>{s.category}</span></div>
                <Scissors size={25} strokeWidth={1} />
                <h3>{s.name}</h3>
                <div className='service-meta'><span>{s.duration} min</span><strong>{s.priceNote ?? `${s.price} €`}</strong></div>
                <div className='service-book'>Marcar <Plus size={17} /></div>
              </button>
            ))}
          </div>
        </section>

        <section className='team-section' id='equipa'>
          <div>
            <div className='eyebrow'>QUEM CUIDA DE SI</div>
            <h2>Talentos diferentes.<br />O mesmo cuidado.</h2>
            <p>Escolha a sua profissional ou deixe-nos sugerir quem está livre.</p>
          </div>
          <div className='team-list'>
            {staff.map(s => (
              <div key={s.id}>
                <span className='avatar' style={{ color: s.color, background: s.color + '18' }}>{initials(s.name)}</span>
                <strong>{s.name}<small>{s.role}</small></strong>
              </div>
            ))}
          </div>
        </section>

        <section className='visit' id='visita'>
          <div>
            <div className='eyebrow'>ATÉ JÁ, AVEIRO</div>
            <h2>O seu próximo cuidado<br />começa aqui.</h2>
            <p><MapPin size={18} /> {salon.address}</p>
            <a href={salon.mapsUrl} target='_blank' rel='noreferrer'>Ver no mapa</a>
            <p><Phone size={18} /> <a className='inline' href={`tel:${salon.phone.replace(/\s/g, '')}`}>{salon.phone}</a></p>
          </div>
          <div className='hours'>
            <h3><Clock size={18} /> Horário</h3>
            <dl>
              {[1, 2, 3, 4, 5, 6, 0].map(d => (
                <div key={d}>
                  <dt>{weekdays[d]}</dt>
                  <dd>{openingHours[d]?.length ? openingHours[d].map(([a, b]) => `${time(a)}–${time(b)}`).join(' · ') : 'Fechado'}</dd>
                </div>
              ))}
            </dl>
            <button className='primary' onClick={() => book()}>Marcar agora</button>
          </div>
        </section>
      </main>
      <footer>
        <Link className='brand' href='/'>STUDIO <strong>SP</strong></Link>
        <span>© {new Date().getFullYear()} {salon.name} · {salon.address}</span>
        <a className='management-link' href='/privacidade'>Privacidade</a>
        <a className='management-link' href='/entrar'>Área da equipa</a>
      </footer>
      {booking && <BookingDialog key={booking.n} initialService={booking.service} onClose={() => setBooking(null)} />}
    </>
  );
}
