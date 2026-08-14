# INTEGRAÇÃO DOS SISTEMAS EXISTENTES

O Portal Astrotur deve funcionar como um **hub central de acesso** aos dois sistemas internos que já existem.

Não recriar esses sistemas dentro do portal.

## 1. PATRI GUARD

Sistema de Gestão de Patrimônio:

**URL real:**

https://patriguard.vercel.app/

No card do PatriGuard, utilizar:

**Título:**
PatriGuard

**Categoria:**
Gestão de Patrimônio

**Descrição:**
Controle, organização e acompanhamento dos patrimônios da Astrotur.

**Botão:**
Acessar PatriGuard →

Ao clicar no botão, direcionar o usuário para:

https://patriguard.vercel.app/

Abrir o sistema em uma nova aba.

---

# 2. HELPDESK

Sistema de suporte e chamados de TI:

**URL real:**

https://astrotur-helpdesk.vercel.app/dashboard

No card do HelpDesk, utilizar:

**Título:**
HelpDesk

**Categoria:**
Suporte e Chamados de TI

**Descrição:**
Abra chamados, acompanhe solicitações e encontre suporte para problemas de tecnologia.

**Botão:**
Acessar HelpDesk →

Ao clicar no botão, direcionar o usuário para:

https://astrotur-helpdesk.vercel.app/dashboard

Abrir o sistema em uma nova aba.

---

# 3. COMPORTAMENTO DOS CARDS

Os dois cards precisam ser os elementos de maior destaque da página inicial.

Estrutura:

```text
┌─────────────────────────────────────┐
│                                     │
│             PATRI GUARD             │
│                                     │
│       Gestão de Patrimônio          │
│                                     │
│  Controle e acompanhamento dos      │
│  ativos da Astrotur.                │
│                                     │
│  1.248 patrimônios                  │
│                                     │
│       [ Acessar PatriGuard → ]      │
│                                     │
└─────────────────────────────────────┘


┌─────────────────────────────────────┐
│                                     │
│              HELPDESK               │
│                                     │
│        Suporte e Chamados           │
│                                     │
│  Abra e acompanhe seus chamados    │
│  de suporte de TI.                 │
│                                     │
│  12 chamados abertos                │
│                                     │
│        [ Acessar HelpDesk → ]       │
│                                     │
└─────────────────────────────────────┘
```

Adicionar um pequeno indicador:

**Sistema externo ↗**

Isso deixa claro para o usuário que ele será direcionado para outro sistema.

---

# 4. NÃO EMBUTIR OS SISTEMAS

Não utilizar iframe para carregar o PatriGuard ou HelpDesk dentro do Portal.

O Portal Astrotur é apenas o ponto central de acesso.

Ao clicar:

```text
Portal Astrotur
      │
      ├── PatriGuard → https://patriguard.vercel.app/
      │
      └── HelpDesk → https://astrotur-helpdesk.vercel.app/dashboard
```

Usar links externos normais e seguros.

Exemplo:

```javascript
window.open(PATRI_GUARD_URL, "_blank", "noopener,noreferrer");
```

e

```javascript
window.open(HELPDESK_URL, "_blank", "noopener,noreferrer");
```

---

# 5. CONFIGURAÇÃO DAS URLS

Mesmo que as URLs sejam conhecidas agora, não espalhar os endereços diretamente pelo código.

Centralizar em um arquivo de configuração.

Exemplo:

```javascript
export const SYSTEMS = {
  patriguard: {
    name: "PatriGuard",
    description: "Gestão de Patrimônio",
    url: "https://patriguard.vercel.app/",
  },

  helpdesk: {
    name: "HelpDesk",
    description: "Suporte e Chamados de TI",
    url: "https://astrotur-helpdesk.vercel.app/dashboard",
  },
};
```

Dessa maneira, se futuramente o endereço de algum sistema mudar, basta alterar um único local.

---

# 6. ACESSO RÁPIDO

Na área "Acesso rápido", utilizar os mesmos links reais.

Criar:

### PatriGuard

Ícone de patrimônio

**Gestão de Patrimônio**

`Acessar →`

Link:

https://patriguard.vercel.app/

### HelpDesk

Ícone de suporte

**Chamados e Suporte de TI**

`Acessar →`

Link:

https://astrotur-helpdesk.vercel.app/dashboard

---

# 7. SIDEBAR

A sidebar também deve utilizar esses links.

Estrutura:

```text
ASTROTUR
Portal Corporativo

INÍCIO

SISTEMAS
  ◈ PatriGuard
  ◈ HelpDesk

OPERAÇÃO
  ◈ Frota
```

Ao clicar em PatriGuard:

→ abrir https://patriguard.vercel.app/

Ao clicar em HelpDesk:

→ abrir https://astrotur-helpdesk.vercel.app/dashboard

Não criar páginas duplicadas para esses sistemas.

---

# 8. IMPORTANTE SOBRE AUTENTICAÇÃO

Neste primeiro momento, NÃO implementar login unificado.

O Portal deve simplesmente direcionar para os sistemas existentes.

Porém, estruturar o código de forma que futuramente seja possível implementar:

* Single Sign-On
* autenticação centralizada
* sessão compartilhada
* permissões por usuário
* integração via API

A arquitetura deve permitir essa evolução sem precisar reconstruir o portal.

---

# 9. OBJETIVO FINAL

A experiência deve ser:

```text
                    ASTROTUR
                       │
                       ▼
              PORTAL CORPORATIVO
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
        PATRI GUARD           HELPDESK
        Patrimônio          Suporte de TI
             │                   │
             ▼                   ▼
      Sistema existente    Sistema existente
```

O Portal não substitui os sistemas.

Ele é a **porta de entrada oficial para os sistemas internos da Astrotur**.

Os dois sistemas devem ter muito destaque na Home.

A frota deve complementar a experiência e reforçar a identidade da empresa.
