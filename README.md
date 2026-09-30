# STUDIO SP — Demonstração

Site de apresentação e agenda funcional em português, com dados fictícios.

## Demonstração
1. Abra o site e escolha «Marcar agora».
2. Escolha serviço, profissional, data e horário disponível. Use um nome fictício.
3. Abra «Demonstração da gestão» no rodapé para ver a marcação.
4. Clique numa marcação para reagendar ou cancelar; use «Bloquear horário» para simular ausências.

A agenda guarda dados no servidor. As reservas sobrepostas são impedidas por slots únicos de 30 minutos em transações atómicas. O dia atual recebe dados de exemplo uma única vez. A vista semanal carrega os sete dias.

## Limites desta versão
O acesso é privado através da plataforma Sites. Os modos cliente e gestão destinam-se à mesma sessão de apresentação; não existem permissões individuais de colaboradores. Não alterar a audiência para pública sem implementar autorização para a gestão e separar a disponibilidade pública dos dados de clientes. Sem pagamentos, notificações ou reservas reais. Equipa, valores, disponibilidade e imagem são ilustrativos.

Fotografia: Guilherme Petri / Unsplash, https://unsplash.com/photos/salon-chairs-at-white-vanity-PtOfbGkU3uI (Unsplash License).

Validação: TypeScript, compilação Worker, testes locais de criação/persistência/reagendamento/cancelamento, bloqueios, conflitos e serviços incompatíveis. Verificação visual no navegador e WebMCP indisponíveis por restrição do navegador nesta sessão.

## Apresentação animada

Abra `/apresentacao` para uma apresentação de 40 segundos, com seis etapas: site, serviço, horário, confirmação, agenda e acesso à demonstração. Pode pausar, repetir, escolher uma etapa ou usar ecrã inteiro. A sequência é ilustrativa e não escreve na base de dados. A reprodução automática respeita a preferência por movimento reduzido. O site funcional e a agenda continuam acessíveis em `/` e `/gestao`.
