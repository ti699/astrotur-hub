# Backend Astrotur Hub

API Fastify + TypeScript + PostgreSQL.

## Endpoints

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/health` | público | Healthcheck |
| POST | `/api/auth/login` | público | `{email, password}` → `{token, user}` |
| POST | `/api/auth/cadastro` | público | `{name, email, password(min 8), setor}` → cria usuário comum |
| GET | `/api/auth/me` | autenticado | Usuário atual |
| POST | `/api/sso/ticket` | JWT do Hub | `target_system` igual a `patrimonio` ou `helpdesk` → ticket de uso único válido por 60s |
| POST | `/api/sso/validate` | segredo server-to-server | `{ticket, client_secret}` → perfil do usuário e consumo atômico do ticket |
| GET | `/api/metrics` | autenticado | Métricas Patrimônio Astrotur/HelpDesk (gestor = visão geral, usuário = próprios dados) |
| GET/POST | `/api/admin/users` | gestor | Listar / criar usuários (`setor` obrigatório no cadastro) |
| PUT | `/api/admin/users/:id` | gestor | Alterar nome, e-mail, setor e status (`setor` obrigatório) |
| PATCH/DELETE | `/api/admin/users/:id/role` / `/api/admin/users/:id` | gestor | Alterar papel / inativar usuário |
| POST | `/api/auth/password-reset/request` | público | Solicitar link de redefinição por e-mail |
| POST | `/api/auth/password-reset/confirm` | público | Definir nova senha com token válido |

Autenticação: header `Authorization: Bearer <token>`.

O token de login permanece válido por 30 dias por padrão, inclusive depois de fechar
o navegador. Configure `JWT_EXPIRES_IN` no ambiente do backend para alterar esse prazo;
sair da conta remove o token salvo no navegador.

### Integração SSO dos sistemas de destino

Configure `PATRIMONIO_SSO_CLIENT_SECRET` e `HELPDESK_SSO_CLIENT_SECRET` no ambiente
do backend usando valores aleatórios distintos com pelo menos 32 caracteres. Não
use esses segredos no frontend nem os envie ao navegador. A rota de ticket retorna
`{ "ticket": "...", "expires_in": 60 }`; o sistema correspondente recebe o ticket
em `GET /sso?ticket=...` e seu backend deve resgatá-lo chamando por HTTPS
`POST https://<api-do-hub>/api/sso/validate` com o ticket e o segredo do próprio
sistema. A resposta válida é `{ "valid": true, "user": { "id", "name", "email",
"role", "setor" } }`. O mesmo ticket não pode ser resgatado novamente, expirado ou
resgatado pelo outro sistema.

O frontend deve usar `VITE_API_URL` apontando para a API HTTPS do Hub e os
destinos devem estar configurados com URLs HTTPS (`VITE_PATRIMONIO_URL` e
`VITE_HELPDESK_URL`). O Hub não abre o destino se a emissão do ticket falhar.
As migrações criam a tabela de tickets automaticamente no início do backend.

### Recuperação de senha

Configure no `.env` do backend `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`,
`SMTP_PASSWORD` e `SMTP_FROM` com os dados do serviço de e-mail, e `FRONTEND_URL` com
a URL pública do portal (por exemplo, `https://portal.astrotur.com.br`). Sem essas
configurações, a API informa que a recuperação está indisponível. A solicitação
responde de forma genérica para não revelar se um e-mail está cadastrado. O link é
de uso único, expira em 30 minutos e guarda somente o hash do token no banco. A tabela
necessária é criada automaticamente na inicialização do container.

Quando `PATRIMONIO_API_URL` e `PATRIMONIO_SSO_CLIENT_SECRET` estiverem definidos,
cadastros e alterações de usuários enviam de forma assíncrona
`POST <PATRIMONIO_API_URL>/api/users/sync-from-hub` com `nome`, `email`, `role`
e `setor`, autenticado pelo header `x-sso-secret`. Falhas são registradas no log
e não impedem as operações no Hub.

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
