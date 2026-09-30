'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, ExternalLink, Maximize, Minimize, MousePointer2, Pause, Play, RotateCcw, Scissors, Sparkles, Users, X } from 'lucide-react';

const chapters = [
  { title: 'A primeira impressão', label: 'O seu salão, online', copy: 'Uma presença cuidada, onde cada cliente encontra o seu próximo momento.', seconds: 6, detail: 'Serviços e marcações no mesmo lugar.' },
  { title: 'O serviço certo', label: 'Escolher um cuidado', copy: 'Cabelo, estética, manicura ou massagem. O cliente começa pelo que precisa.', seconds: 6, detail: 'Duração e preço visíveis antes de marcar.' },
  { title: 'Um horário que encaixa', label: 'Encontrar o momento', copy: 'Escolhe o profissional e consulta os horários disponíveis para o serviço.', seconds: 8, detail: 'Disponibilidade por profissional.' },
  { title: 'Tudo confirmado', label: 'Confirmar a marcação', copy: 'Os detalhes ficam reunidos numa confirmação simples de consultar.', seconds: 5, detail: 'Serviço, profissional, data e hora.' },
  { title: 'A equipa em sintonia', label: 'Organizar o dia', copy: 'A nova marcação aparece na agenda do profissional. Toda a equipa vê o dia organizado.', seconds: 9, detail: 'Agenda por profissional, com prevenção de sobreposições.' },
  { title: 'Agora, experimente', label: 'Do conceito à prática', copy: 'Explore o site e faça uma marcação de exemplo. Depois, encontre-a na agenda da equipa.', seconds: 6, detail: 'Uma demonstração funcional, pronta a explorar.' },
];
const starts = chapters.map((_, index) => chapters.slice(0, index).reduce((total, chapter) => total + chapter.seconds, 0));
const totalSeconds = chapters.reduce((total, chapter) => total + chapter.seconds, 0);
const people = ['Sofia Martins', 'Beatriz Costa', 'Inês Silva', 'Mariana Santos'];
const initials = ['SM', 'BC', 'IS', 'MS'];
const money = ['35 €', '65 €', '25 €', '50 €'];
const treatments = ['Corte e brushing', 'Coloração e brushing', 'Manicura gel', 'Massagem relaxante'];
const formatTime = (value: number) => `00:${Math.floor(value).toString().padStart(2, '0')}`;

export default function Presentation() {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [hint, setHint] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<number>(0);
  const scene = Math.max(0, starts.findLastIndex(start => elapsed >= start));
  const chapter = chapters[scene];
  const progress = Math.min(1, (elapsed - starts[scene]) / chapter.seconds);
  const complete = elapsed >= totalSeconds;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => { setReduced(media.matches); if (media.matches) setPlaying(false); };
    apply();
    setPlaying(!media.matches);
    media.addEventListener('change', apply);
    const syncFullscreen = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => { media.removeEventListener('change', apply); document.removeEventListener('fullscreenchange', syncFullscreen); };
  }, []);

  useEffect(() => {
    if (!playing || complete) return;
    let previous = performance.now();
    let collected = 0;
    function tick(now: number) {
      const delta = Math.min((now - previous) / 1000, 0.2);
      previous = now;
      if (document.visibilityState === 'visible') collected += delta;
      if (collected >= 0.05) {
        const amount = collected;
        collected = 0;
        setElapsed(value => Math.min(totalSeconds, value + amount));
      }
      frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [playing, complete]);

  function toggle() {
    if (complete) { setElapsed(0); setPlaying(true); }
    else setPlaying(value => !value);
  }
  function select(index: number) {
    setElapsed(starts[Math.max(0, Math.min(chapters.length - 1, index))]);
    setPlaying(false);
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (root.current?.requestFullscreen) await root.current.requestFullscreen();
      else setHint('Use o modo de ecrã inteiro do seu navegador.');
    } catch { setHint('O navegador não permitiu o ecrã inteiro. A apresentação continua disponível.'); }
  }

  return <div className={`pitch ${!playing || complete ? 'pitch-paused' : ''} ${reduced ? 'pitch-reduced' : ''}`} ref={root} onKeyDown={event => {
    if ((event.target as HTMLElement).closest('button, a, input, select, textarea')) return;
    if (event.key === ' ') { event.preventDefault(); toggle(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); select(scene + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); select(scene - 1); }
  }} tabIndex={-1}>
    <header className='pitch-header'>
      <a className='pitch-brand' href='/' aria-label='Abrir site STUDIO SP'>STUDIO <b>SP</b><span>AVEIRO</span></a>
      <div className='pitch-header-center'><span className='pitch-line'/> UMA AGENDA EM HARMONIA</div>
      <a className='pitch-live' href='/'><span>Experimentar a demonstração</span><ExternalLink size={15}/></a>
    </header>
    <main className='pitch-main'>
      <section className='pitch-story' aria-live='polite' aria-atomic='true'>
        <div className='pitch-kicker'>UMA EXPERIÊNCIA STUDIO SP</div>
        <div key={scene} className='pitch-story-content'>
          <div className='pitch-counter'><span>{String(scene + 1).padStart(2, '0')}</span><i/>06</div>
          <h1>{chapter.title}<span>.</span></h1>
          <p>{chapter.copy}</p>
          <div className='pitch-benefit'><Check size={17}/><span>{chapter.detail}</span></div>
        </div>
        <div className='pitch-small-note'>Conceito de demonstração.<br/>Serviços, preços e equipa ilustrativos.</div>
      </section>
      <section className='pitch-stage-wrap' aria-label='Animação da experiência de marcação'>
        <div className='pitch-stage-label'><span>DO CLIENTE À EQUIPA</span><span>{scene === 4 ? 'ÁREA DE GESTÃO' : scene === 5 ? 'PRONTO A EXPERIMENTAR' : 'EXPERIÊNCIA DO CLIENTE'}</span></div>
        <div className='pitch-window'>
          <div className='pitch-window-bar'><div className='pitch-window-dots'><i/><i/><i/></div><span>STUDIO SP <b>/</b> {scene === 4 ? 'Agenda da equipa' : 'O seu momento'}</span><LockMark/></div>
          <div className={`pitch-screen pitch-screen-${scene}`}>
            <div key={scene} className='pitch-scene'>
              {scene === 0 && <Intro progress={progress}/>}
              {scene === 1 && <ServiceScene progress={progress}/>}
              {scene === 2 && <TimeScene progress={progress}/>}
              {scene === 3 && <Confirmed/>}
              {scene === 4 && <Agenda progress={progress}/>}
              {scene === 5 && <FinalScene/>}
            </div>
          </div>
        </div>
        <div className='pitch-under-stage'><span><MousePointer2 size={14}/> Sequência ilustrativa · não cria reservas</span><span>STUDIO SP / BEAUTY & WELLNESS</span></div>
      </section>
    </main>
    <footer className='pitch-controls'>
      <div className='pitch-transport'>
        <button className='pitch-play' onClick={toggle} aria-label={complete ? 'Repetir apresentação' : playing ? 'Pausar apresentação' : 'Reproduzir apresentação'}>{complete ? <RotateCcw size={20}/> : playing ? <Pause size={20} fill='currentColor'/> : <Play size={20} fill='currentColor'/>}</button>
        <div className='pitch-time'><strong>{formatTime(elapsed)}</strong><span> / {formatTime(totalSeconds)}</span></div>
        <button className='pitch-icon-button pitch-restart' onClick={() => { setElapsed(0); setPlaying(!reduced); }} aria-label='Voltar ao início'><RotateCcw size={17}/></button>
      </div>
      <nav className='pitch-chapters' aria-label='Etapas da apresentação'>{chapters.map((item, index) => <button key={item.title} onClick={() => select(index)} aria-label={`Etapa ${index + 1}: ${item.label}`} aria-current={scene === index ? 'step' : undefined} className={scene === index ? 'is-current' : scene > index ? 'is-past' : ''}><span className='pitch-chapter-track'><i style={{width: `${scene > index ? 100 : scene === index ? progress * 100 : 0}%`}}/></span><span className='pitch-chapter-name'>{String(index + 1).padStart(2, '0')}<b>{item.label}</b></span></button>)}</nav>
      <div className='pitch-nav-controls'><button className='pitch-icon-button' onClick={() => select(scene - 1)} disabled={scene === 0} aria-label='Etapa anterior'><ChevronLeft size={20}/></button><button className='pitch-icon-button' onClick={() => select(scene + 1)} disabled={scene === chapters.length - 1} aria-label='Etapa seguinte'><ChevronRight size={20}/></button><button className='pitch-icon-button pitch-fullscreen' onClick={toggleFullscreen} aria-label={fullscreen ? 'Sair do ecrã inteiro' : 'Ecrã inteiro'}>{fullscreen ? <Minimize size={18}/> : <Maximize size={18}/>}</button></div>
    </footer>
    {hint && <div className='pitch-hint' role='status'>{hint}<button onClick={() => setHint('')} aria-label='Fechar aviso'><X size={16}/></button></div>}
  </div>;
}

function LockMark() { return <span className='pitch-preview-tag'>DEMO</span>; }
function MiniBrand() { return <div className='pm-brand'>STUDIO <strong>SP</strong><small>BEAUTY & WELLNESS</small></div>; }
function Pointer({className = ''}:{className?: string}) { return <div className={`pm-pointer ${className}`} aria-hidden='true'><MousePointer2 size={28} fill='#27212b' stroke='white' strokeWidth={1.7}/><span>Cliente</span></div>; }

function Intro({progress}:{progress:number}) {
  return <div className='pm-intro'><div className='pm-nav'><MiniBrand/><div><span>Serviços</span><span>Equipa</span></div><span className={`pm-button ${progress > .62 ? 'pm-highlight' : ''}`}>Marcar agora</span></div><div className='pm-hero'><div className='pm-hero-text'><span className='pm-eyebrow'>O SEU MOMENTO, EM AVEIRO</span><h2>O cuidado<br/>que se sente.<br/><em>A beleza<br/>que fica.</em></h2><p>Cabelo, estética e bem-estar.<br/>Um espaço para cuidar de si.</p><span className='pm-button'>Reserve o seu momento</span></div><div className='pm-image'><img src='/salon.jpg' alt='Imagem ilustrativa de um salão com cadeiras bordeaux'/><span>STUDIO SP / AVEIRO</span></div></div><Pointer className='pm-pointer-intro'/></div>;
}
function ServiceScene({progress}:{progress:number}) {
  return <div className='pm-booking'><div className='pm-booking-top'><MiniBrand/><span>01 — SERVIÇO</span></div><div className='pm-booking-title'><span className='pm-eyebrow'>CUIDADOS À SUA MEDIDA</span><h2>De que precisa hoje?</h2><p>Escolha o seu momento.</p></div><div className='pm-treatments'>{treatments.map((name, index) => <div key={name} className={`pm-treatment ${index === 0 && progress > .35 ? 'pm-treatment-selected' : ''}`} style={{animationDelay: `${index * 90}ms`}}><div className='pm-treatment-icon'>{index < 2 ? <Scissors size={22}/> : <Sparkles size={22}/>}</div><div><h3>{name}</h3><span>{index === 1 ? '120' : '60'} min · {money[index]}</span></div><span className='pm-radio'>{index === 0 && progress > .35 && <Check size={13}/>}</span></div>)}</div><div className={`pm-selection-note ${progress > .35 ? 'pm-visible' : ''}`}><Check size={15}/> Corte e brushing selecionado <b>35 €</b></div><Pointer className='pm-pointer-service'/></div>;
}
function TimeScene({progress}:{progress:number}) {
  return <div className='pm-booking pm-time-booking'><div className='pm-booking-top'><MiniBrand/><span>02 — PROFISSIONAL E HORA</span></div><div className='pm-booking-title'><span className='pm-eyebrow'>CORTE E BRUSHING · 60 MIN</span><h2>Um tempo só para si.</h2></div><div className='pm-professionals'>{people.slice(0,2).map((name,i)=><div key={name} className={i===0&&progress>.15?'pm-professional-selected':''}><span className='pm-avatar'>{initials[i]}</span><span>{name}<small>Especialista em cabelo</small></span>{i===0&&progress>.15&&<Check size={16}/>}</div>)}</div><div className='pm-date-strip'><CalendarDays size={19}/><strong>Quinta-feira, 15 de outubro</strong><span>Data de exemplo</span></div><div className='pm-time-options'>{['09:00','10:30','11:00','14:00','15:30','17:00'].map((hour,i)=><div key={hour} className={`${i===1?'pm-unavailable':''} ${i===3&&progress>.48?'pm-slot-selected':''}`}>{hour}{i===3&&progress>.48&&<Check size={14}/>}</div>)}</div><div className='pm-sim-name'><span>Nome</span><strong>{progress>.65?'Maria Silva':'—'}</strong></div><div className={`pm-button pm-confirm ${progress>.82?'pm-highlight':''}`}>Confirmar marcação <span>35 €</span></div><Pointer className='pm-pointer-time'/></div>;
}
function Confirmed() {
  return <div className='pm-confirmed'><div className='pm-success-ring'><Check size={42} strokeWidth={1.5}/></div><span className='pm-eyebrow'>TUDO PRONTO, MARIA</span><h2>O seu momento<br/>está marcado.</h2><div className='pm-ticket'><div><Scissors size={22}/><strong>Corte e brushing<span>com Sofia Martins</span></strong><b>35 €</b></div><div><span><CalendarDays size={16}/> 15 de outubro</span><span><Clock3 size={16}/> 14:00 · 60 min</span></div><div className='pm-ticket-confirmed'><Check size={14}/> Marcação confirmada</div></div><p>Uma confirmação simples.<br/>Todos os detalhes no mesmo lugar.</p><small>Simulação de apresentação · sem reserva real</small></div>;
}
function Agenda({progress}:{progress:number}) {
  const isAdded=progress>.2;
  return <div className='pm-agenda'><div className='pm-agenda-heading'><div><span className='pm-eyebrow'>STUDIO SP / GESTÃO</span><h2>O dia, em harmonia.</h2></div><span className='pm-date-pill'><CalendarDays size={15}/> 15 de outubro</span></div><div className='pm-agenda-summary'><span><CalendarDays size={16}/><b>{isAdded?'07':'06'}</b> marcações</span><span><Users size={16}/><b>04</b> profissionais</span><span className='pm-agenda-view'>Agenda diária</span></div><div className='pm-agenda-grid'><div className='pm-agenda-corner'/>{people.map((p,i)=><div className='pm-agenda-person' key={p}><span className={`pm-avatar pm-avatar-${i}`}>{initials[i]}</span><strong>{p.split(' ')[0]}<small>{i<2?'Cabelo':i===2?'Manicura':'Estética'}</small></strong></div>)}<div className='pm-agenda-hours'>{['13:00','14:00','15:00','16:00','17:00'].map(t=><span key={t}>{t}</span>)}</div>{people.map((p,i)=><div className={`pm-agenda-lane pm-lane-${i}`} key={p}><div className='pm-agenda-break'>Pausa</div>{i===0&&<><div className={`pm-new-booking ${isAdded?'pm-new-visible':''}`}><span>14:00 — 15:00</span><strong>Maria Silva</strong><small>Corte e brushing</small><i><Check size={11}/> Nova marcação</i></div><div className='pm-existing pm-existing-late'><span>16:00</span><strong>Leonor Costa</strong><small>Corte e brushing</small></div></>}{i===1&&<><div className='pm-existing pm-existing-early'><span>14:00</span><strong>Rita Sousa</strong><small>Coloração</small></div><div className='pm-existing pm-existing-late'><span>16:00</span><strong>Ana Ferreira</strong><small>Corte</small></div></>}{i===2&&<><div className='pm-existing pm-existing-mid'><span>15:00</span><strong>Sara Lopes</strong><small>Manicura gel</small></div><div className='pm-existing pm-existing-late'><span>16:00</span><strong>Diana Martins</strong><small>Manicura gel</small></div></>}{i===3&&<div className='pm-existing pm-existing-early'><span>14:00</span><strong>Teresa Santos</strong><small>Massagem</small></div>}</div>)}</div><div className={`pm-agenda-toast ${isAdded?'pm-visible':''}`}><span><Check size={17}/></span><div><strong>Nova marcação na agenda</strong><small>Maria Silva · Sofia Martins · 14:00</small></div></div></div>;
}
function FinalScene() {
  return <div className='pm-final'><div className='pm-final-logo'>SP<span>STUDIO / AVEIRO</span></div><span className='pm-eyebrow'>MAIS TEMPO PARA CUIDAR</span><h2>O próximo momento<br/>começa aqui.</h2><p>Uma experiência para os clientes.<br/>Uma agenda para toda a equipa.</p><div className='pm-final-actions'><a className='pm-button' href='/'>Experimentar a demonstração <ExternalLink size={16}/></a><a className='pm-secondary-link' href='/gestao'>Explorar a agenda da equipa</a></div><span className='pm-final-note'>Conceito funcional · STUDIO SP</span></div>;
}
