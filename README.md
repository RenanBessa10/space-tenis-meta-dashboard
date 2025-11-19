# Space Tênis – Meta Ads Dashboard

Dashboard completo (FastAPI + React) para monitorar campanhas da Meta Ads com filtros de data, KPIs, gráficos e painel de insights automáticos.

## Tecnologias

- **Backend:** Python, FastAPI, Pydantic
- **Frontend:** React, TypeScript, Vite
- **Estilos:** Tailwind CSS
- **Gráficos:** Recharts

## Estrutura

```
app/               # FastAPI
frontend/          # React + Vite + Tailwind
```

## Configuração

1. Crie um arquivo `.env` com as variáveis:

```
META_ACCESS_TOKEN=seu_token
META_AD_ACCOUNT_ID=act_XXXXXXXXXXXX
META_API_VERSION=v19.0
# opcional: sobrescreve os domínios liberados no CORS (separe por vírgula)
FRONTEND_ORIGINS=http://localhost:5173,https://bolt.new
```

2. Instale dependências do backend e execute:

```
pip install -r requirements.txt
uvicorn app.main:app --reload
```

3. Instale dependências do frontend e execute:

```
cd frontend
npm install
npm run dev
```

4. Ajuste a URL base do frontend com `VITE_API_URL` se necessário (por padrão usa `http://localhost:8000`).

O endpoint principal é `GET /api/dashboard/summary`, que retorna KPIs, série temporal, tabela de campanhas e insights.
