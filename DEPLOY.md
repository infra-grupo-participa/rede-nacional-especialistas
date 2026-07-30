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
- Agendar um cron chamando `select rede.sync_alunos_thb();` para manter o espelho da
  base de alunos (`vw_aluno_360`) atualizado.

## Notas

- `output: standalone` foi **removido** do `next.config.ts` de propósito: ele conflita
  com o `server.js` custom (o Next avisa e ignora o `next start`). Sem standalone, o
  `server.js` funciona como esperado — igual ao gps-thb.
- Imagens usam `<Image unoptimized>` (avatares/capas de qualquer host).
