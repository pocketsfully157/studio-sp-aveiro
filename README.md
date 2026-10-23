# STUDIO SP — Site e agenda de marcações

Site do salão STUDIO SP (Aveiro) com marcação online e agenda da equipa.

- **Site público** (`/`): serviços, equipa, horário e contactos. As clientes marcam online e veem só os horários realmente livres. Podem escolher a profissional ou «qualquer profissional».
- **Gerir marcação** (`/marcacao/<código>`): link enviado à cliente para ver ou cancelar a marcação (até 24 h antes).
- **Gestão** (`/gestao`, com login):
  - agenda por dia e por semana, filtrada por profissional e por serviço;
  - criar, alterar e cancelar marcações; bloquear horários;
  - gestão de contas da equipa.
- **Contas**: a gerência vê e gere tudo. Cada profissional vê e gere só a sua agenda.
- **Avisos**: confirmação, alteração, cancelamento e lembrete 24 h antes, por email (Resend) e SMS/WhatsApp (Twilio).

Stack: Next.js (via [vinext](https://github.com/cloudflare/vinext)) em Cloudflare Workers, base de dados Cloudflare D1, migrações Drizzle.

## Estrutura

| Onde | O quê |
| --- | --- |
| `lib/config.ts` | **Dados do salão**: contactos, equipa, serviços, preços, horários, feriados e regras de marcação |
| `lib/schedule.ts` | Regras de horário partilhadas por site, gestão e servidor |
| `lib/server/` | Base de dados, autenticação, marcações, avisos e lembretes |
| `app/api/` | API pública (`availability`, `bookings`, `manage`), autenticação e gestão (`admin/*`) |
| `components/public/` | Site e formulário de marcação |
| `components/admin/` | Agenda, editor de marcações, equipa e conta |
| `worker/index.ts` | Ponto de entrada do Worker (pedidos e cron dos lembretes) |
| `drizzle/` | Migrações SQL da base de dados |

## Desenvolvimento

```bash
npm install
cp .dev.vars.example .dev.vars   # e defina SETUP_TOKEN
npm run db:migrate               # cria as tabelas na base de dados local
npm run dev                      # http://localhost:5173
```

Na primeira utilização abra `/entrar` › «Criar a conta de gerência» e introduza o `SETUP_TOKEN`. Depois, em **Equipa e acessos**, crie uma conta para cada profissional.

Sem chaves de email/SMS os avisos não são enviados, mas aparecem no terminal.

Outros comandos: `npm run typecheck`, `npm run lint`, `npm run build`.

Para testar os lembretes localmente: `curl http://localhost:5173/cdn-cgi/handler/scheduled`.

## Dados do salão

Os dados em `lib/config.ts` são **provisórios** e têm de ser substituídos pelos reais antes de publicar:

- contactos, morada, NIF e designação legal (usados também na Política de Privacidade);
- equipa: nome, especialidade, cor na agenda e horário próprio opcional (`hours`);
- serviços: duração, preço, texto de preço variável (`priceNote`) e quem os faz;
- horário de abertura, feriados e férias (`closedDates`);
- regras: antecedência mínima, máximo de dias, prazo para cancelar e quando enviar o lembrete.

Reveja também o texto de `app/privacidade/page.tsx` e a fotografia `public/salon.jpg` (provisória; fotografia de Guilherme Petri, Unsplash).

## Publicar na Cloudflare

1. Entrar na conta Cloudflare: `npx wrangler login`
2. Criar a base de dados: `npx wrangler d1 create studio-sp-aveiro` e copiar o `database_id` para `wrangler.jsonc`.
3. Em `wrangler.jsonc`, definir `SITE_URL` com o endereço final, por exemplo `https://www.studiosp.pt`.
4. Definir os segredos (cada comando pede o valor):
   ```bash
   npx wrangler secret put SETUP_TOKEN
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put EMAIL_FROM
   npx wrangler secret put TWILIO_ACCOUNT_SID
   npx wrangler secret put TWILIO_AUTH_TOKEN
   npx wrangler secret put TWILIO_SMS_FROM        # ou TWILIO_WHATSAPP_FROM
   ```
5. Publicar (compila, aplica migrações e publica): `npm run deploy`
6. Abrir `/configurar`, criar a conta de gerência e depois as contas da equipa.
7. Ligar o domínio: Cloudflare › Workers › studio-sp-aveiro › Settings › Domains & Routes.

### Avisos

- **Email**: criar conta em resend.com, verificar o domínio do salão e usar um remetente desse domínio em `EMAIL_FROM`.
- **SMS**: comprar um número ou registar um remetente alfanumérico na Twilio (`TWILIO_SMS_FROM`).
- **WhatsApp**: mudar `notificationSettings.textChannel` para `'whatsapp'` em `lib/config.ts`. O WhatsApp só permite mensagens iniciadas pela empresa com *templates* aprovados pela Meta, o que exige registar o número e os templates na Twilio.

## Segurança e dados pessoais

- Passwords guardadas com PBKDF2. Sessões em cookie `HttpOnly`/`SameSite=Lax` com 30 dias de validade.
- A conta é bloqueada 15 min após 5 tentativas de login falhadas.
- Os pedidos de escrita vindos de outros sites são recusados.
- A API pública devolve só horários livres, nunca dados de clientes.
- O formulário público exige consentimento (guardado com a data) e tem proteção anti-spam simples. Se aparecer spam, considerar Cloudflare Turnstile.
- Marcações sobrepostas são impossíveis: cada meia hora ocupada é uma linha com chave única, gravada numa transação.

## Apresentação

`/apresentacao` é a apresentação animada usada para mostrar o conceito. Não tem ligações a partir do site e pode ser removida.
