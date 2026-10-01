# Deploy — Rede Nacional de Especialistas (Node App na Hostinger)

App **Next.js 16** (App Router). O backend são as **Server Actions/Components** do
próprio Next — não há Express/servidor separado. Na Hostinger roda como **Node App**
sob **Phusion Passenger**, cujo entrypoint é o [`server.js`](./server.js) (sobe o Next
em modo produção e escuta `process.env.PORT`). Mesmo padrão do `gps-thb`.

## Variáveis de ambiente (painel da Hostinger)

Definir no painel do Node App (NÃO versionar segredos):

```
NEXT_PUBLIC_SUPABASE_URL=https://mbvybujpkwuorhtdzcde.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/publishable key>
NEXT_PUBLIC_SUPABASE_SCHEMA=rede
```

> O schema `rede` já está exposto no PostgREST (`pgrst.db_schemas` inclui `rede`).

## Passos

1. Clonar o repo no diretório do app (ou fazer `git pull` na `main`).
2. Configurar no hPanel do Node App:
   - **Application startup file**: `server.js`
   - **Node version**: 20 ou superior
3. `npm install`
4. `npm run build`  ← gera a build de produção que o `server.js` serve
5. **Iniciar/Reiniciar** o app pelo hPanel (Passenger executa `server.js`).
   Fora do Passenger, o comando é `npm start` (que roda `node server.js`).

## Pós-deploy

- Apontar o domínio definitivo + SSL para o app.
- Atualizar **Supabase Auth → URL Configuration** (Site URL / Redirect URLs) para o
  domínio de produção, senão os links de auth voltam para localhost.
- O cron do espelho da base de alunos (`select rede.sync_alunos_thb();`) é criado pela
  migration 0006 (job `rede-sync-alunos-thb`, 03:00 de Brasília) quando o pg_cron existe.
  Sem pg_cron, agendar à mão ou usar o botão em `/comunidade/coordenacao/entrada`.

## Notas

- **Build com webpack (desde 01/10/2026).** `npm run build` roda `next build --webpack`.
  Desde 29/09/2026 ~13:30 UTC todo build com Turbopack na Hostinger cai no PostCSS com
  "node process exited before we could connect to it" (visto também no gps-thb, commit
  e1f599c, e no sistema-grupo-participa-v2). Quando o build falha, a Hostinger mantém o
  build anterior no ar e **não avisa**: o push de 30/09 (PR #2) ficou sem publicar por
  isso. O Turbopack continua disponível em `npm run build:turbopack` para voltar quando
  a Hostinger normalizar. O webpack valida os exports de `page.tsx`: não exporte nada
  além do componente e das configs de rota.
- **O gatilho automático falha às vezes.** Em 01/10 três pushes seguidos publicaram em
  ~100 s e o quarto (a reversão, PR #7) não publicou. Se nada mudar em 3 minutos, um novo
  push ou o botão Reimplantar do hPanel resolve.
- **Como saber se o deploy entrou:** o push na `main` publica em menos de 1 minuto (em
  04/08 foram 37 s). Confira uma rota nova ou o nome do CSS em `/_next/static/`. Se nada
  mudar, olhe o log de Deployments do Node App no hPanel.

- `output: standalone` foi **removido** do `next.config.ts` de propósito: ele conflita
  com o `server.js` custom (o Next avisa e ignora o `next start`). Sem standalone, o
  `server.js` funciona como esperado — igual ao gps-thb.
- Imagens usam `<Image unoptimized>` (avatares/capas de qualquer host).
