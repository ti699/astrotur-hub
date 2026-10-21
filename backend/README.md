# Backend Astrotur Hub

API Fastify + TypeScript + PostgreSQL.

## Endpoints

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/health` | público | Healthcheck |
| POST | `/api/auth/login` | público | `{email, password}` → `{token, user}` |
| POST | `/api/auth/register` | público | `{name, email, password(min 8)}` → cria usuário comum |
| GET | `/api/auth/me` | autenticado | Usuário atual |
| GET | `/api/metrics` | autenticado | Métricas Patrimônio Astrotur/HelpDesk (gestor = visão geral, usuário = próprios dados) |
| GET/POST | `/api/users` | gestor | Listar / criar usuários |
| PATCH/DELETE | `/api/users/:id` | gestor | Alterar nome, perfil, ativo, senha / excluir |

Autenticação: header `Authorization: Bearer <token>`.

Métricas: se `PATRIMONIO_API_URL` / `HELPDESK_API_URL` estiverem definidas, a API chama
`GET <url>?scope=all|mine&user=<email>` esperando `{ "metrics": [{ "label", "value" }] }`.
Sem elas (ou se falharem), retorna "—".

## Desenvolvimento local

```bash
cd backend
cp .env.example .env   # ajuste DATABASE_URL para um Postgres local
npm install
npm run migrate
npm run dev
```

## Deploy na VPS (Ubuntu + Docker)

1. Aponte um DNS (ex.: `api.seudominio.com.br`) para o IP da VPS.
2. Instale Docker: `curl -fsSL https://get.docker.com | sh`
3. Copie a pasta `backend/` para a VPS e crie o `.env` a partir de `.env.example`
   (defina `JWT_SECRET`, `POSTGRES_PASSWORD`, `ADMIN_PASSWORD`, `CORS_ORIGINS`;
   `DATABASE_URL` deve usar a mesma senha do Postgres).
4. Edite `nginx/default.conf` trocando o domínio.
5. Emita o certificado **antes** de subir o Nginx (porta 80 precisa estar livre):
   ```bash
   docker compose run --rm -p 80:80 certbot certonly --standalone -d api.seudominio.com.br --agree-tos -m seu@email.com
   ```
6. Suba tudo: `docker compose up -d --build`
7. Teste: `curl https://api.seudominio.com.br/api/health`
8. Libere apenas as portas 22, 80 e 443 no firewall (`ufw`).

Renovação do certificado: `docker compose run --rm certbot renew && docker compose exec nginx nginx -s reload` (agende no cron).
