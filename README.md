# Space Tênis — Monitor de Preços

Dashboard inicial para monitoramento de preços de tênis esportivos, comparando automaticamente valores do ecommerce próprio com concorrentes.

## Como funciona
- **Importação automática**: mock que simula a importação da lista de produtos do ecommerce (nome, SKU, URL e preço atual).
- **Cadastro de concorrentes**: endpoint e formulário para adicionar novas fontes de comparação.
- **Coleta diária**: job cron interno dispara coleta simulada de preços para cada produto e concorrente, registrando histórico.
- **Banco**: estrutura modelada para Supabase nas tabelas `produtos`, `concorrentes` e `precos_coletados`.
- **Alertas internos**: configure limites por produto e receba notificações in-app quando concorrentes ficarem significativamente mais baratos.
- **URLs por produto**: associe múltiplos concorrentes a cada SKU com links específicos usados na coleta diária.

## Rodando localmente
1. Instale dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor:
   ```bash
   npm start
   ```
3. Acesse `http://localhost:3000` para ver o dashboard.

4. Checagem rápida de qualidade de código:
   ```bash
   npm run lint
   ```

> Dica: para usar Supabase real, defina as variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env`. Sem elas, o app usa um banco em memória com dados de exemplo.

## Deploy na Vercel (corrige 404 NOT_FOUND)
- O projeto já inclui `vercel.json` e um handler serverless em `api/index.js` que reutiliza o Express (`src/app.js`).
- Passos rápidos:
  1. Faça login no Vercel CLI: `vercel login`.
  2. Rode uma prévia local: `vercel dev` (usa `api/index.js` e os estáticos de `public`).
  3. Publique: `vercel --prod`.
- A rota `/api/*` é redirecionada para a função Node e todo o restante cai no `public/index.html`, evitando o erro 404.

## Endpoints principais
- `POST /api/importar` — dispara importação mock do ecommerce.
- `POST /api/concorrentes` — adiciona uma fonte de concorrência (`nome`, `url_base`).
- `PATCH /api/concorrentes/:id` — edita nome e URL base de uma fonte existente.
- `DELETE /api/concorrentes/:id` — remove concorrente e desvincula URLs associadas.
- `POST /api/coletar-agora` — executa coleta simulada imediata.
- `GET /api/dashboard` — retorna snapshot com totais, últimas coletas e séries históricas.
- `GET /api/alertas` — painel de alertas internos e contagem de não lidos.
- `GET/POST /api/alertas/configuracao` — lista e salva limites percentuais por produto.
- `PATCH /api/alertas/:id/lido` — marca alertas como lidos no painel.
- `GET /api/associacoes` — lista as URLs de produtos de concorrentes vinculadas a cada SKU.
- `POST/PATCH/DELETE /api/associacoes` — cria, atualiza ou remove vínculos produto ⇄ concorrente.

## Estrutura do banco (Supabase)
Veja [`db/schema.sql`](db/schema.sql) para as tabelas e relacionamentos, incluindo o vínculo `produto_concorrente_urls` para mapear URLs específicas por SKU.

## Knowledge Base rápida
Consulte [`docs/knowledge-base.md`](docs/knowledge-base.md) para a visão consolidada do produto, arquitetura, diretrizes e design system usados no monitor de preços.
