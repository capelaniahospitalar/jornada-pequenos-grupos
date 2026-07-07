# Homologação Operacional — RC1

> Referência: `ESTADO-E-ROADMAP.md` (seção "Release Candidate RC1"). Baseline de restauração:
> tag `v3-rc1-baseline` + snapshot `BASELINE-RC1-2026-07-02.json`
> (`C:\Users\wladimir.souza\Documents\backups-firebase-jdpg\`).

## Roteiro rápido (seguir com os celulares na mão)

**Antes:** em cada celular → `<url>?resetar` → limpar cache → remover o app da tela inicial (se instalado).

- **📱 Celular 1 — Tutor (Wladimir):** abrir `<url>?tutor` → nome + WhatsApp + criar senha → **"Criar
  Primeiro Pequeno Grupo"** → dar nome → gerar **convite do Coordenador** → enviar o link ao Celular 2.
- **📱 Celular 2 — Coordenador:** abrir o link → nome + WhatsApp → **"Entrar na Jornada"** → **"Convidar
  Participante"** → enviar o link ao Celular 3.
- **📱 Celular 3 — Participante:** abrir o link → nome + WhatsApp → **"Entrar na Jornada"**.

**✅ 3 verificações:** (1) abrir um link **já usado** → *"convite já utilizado"*; (2) postar uma
gratidão num celular → **aparece nos outros**; (3) o Participante **não** vê "Convidar"/"Painel", o
Coordenador vê.

**🎯 Deu certo se:** a corrente Tutor → Coordenador → Participante funcionou toda por link, cada um no
**grupo e papel certos**, e as 3 verificações passaram.

*(Detalhamento completo, com o "Esperado" de cada passo, nas Fases 0–5 abaixo.)*

---

## Roteiro de homologação operacional

> Primeira homologação **oficial** da cadeia por convites, contra a **produção no estado Marco Zero**.
> Regra de ouro: achou problema → registra `BUG-XXX` abaixo e **NÃO corrige durante a homologação**
> (correção em lote depois — ver "Regra da homologação").

### FASE 0 — Preparação
- ☐ Produção reinicializada (Marco Zero — ver `ESTADO-E-ROADMAP.md` › "Estado dos dados na nuvem")
- ☐ Grupo 1 (CAPELANIA) inexistente — os 50 slots vazios
- ☐ Nenhum participante / coordenador / tutor associado a grupo · nenhum convite ativo
- ☐ Allowlist dos 4 tutores preservada (Felipe, Ualace, Renan, Wladimir)
- ☐ Backup `PRE-HOMOLOGACAO-2026-07-04.json` realizado (fora do repo — contém PII)
- ☐ Todos os aparelhos resetados (`<url>?resetar` + limpar cache + remover PWA) — como celular novo
- ☐ Em mãos: URL do app, link do Tutor (`<url>?tutor`), este documento aberto p/ registrar `BUG-XXX`

### FASE 1 — Aparelho do Tutor (Wladimir)
| # | O que fazer | Esperado | OK |
|---|---|---|---|
| 1 | Abrir `<url>?tutor` | Tela "Painel do Tutor/Coordenador" (login por nome) | ☐ |
| 2 | Nome (Wladimir) → WhatsApp cadastrado → criar senha | Aceita (está na allowlist); WhatsApp errado bloquearia | ☐ |
| 3 | Painel abre | "Autorizado, sem grupo" + **"➕ Criar Primeiro Pequeno Grupo"** | ☐ |
| 4 | Criar o PG (dar um nome) | PG criado no 1º slot vazio; Wladimir vira Tutor | ☐ |
| 5 | Convite do Coordenador | Gera link `?conv=` automático + texto WhatsApp pronto | ☐ |
| 6 | Enviar o link ao aparelho do Coordenador | — | ☐ |

### FASE 2 — Aparelho do Coordenador
| # | O que fazer | Esperado | OK |
|---|---|---|---|
| 1 | Abrir o link recebido | Entrada: nome + WhatsApp, função **"Coordenador" (travada 🔒)**, nº+nome do PG | ☐ |
| 2 | Preencher e "Entrar na Jornada" | Entra **automaticamente no PG correto**, papel Coordenador | ☐ |
| 3 | Ver a Home | Aparece o **Bloco Liderança** (Convidar Participante + Painel do Tutor/Coordenador) | ☐ |
| 4 | Abrir o Painel | Login por nome + WhatsApp + senha; mostra o grupo dele | ☐ |
| 5 | Gerar convite de **Participante** | Link `?conv=` + texto WhatsApp | ☐ |
| 6 | Enviar ao aparelho do Participante | — | ☐ |

### FASE 3 — Aparelho do Participante
| # | O que fazer | Esperado | OK |
|---|---|---|---|
| 1 | Abrir o link | Entrada: nome + WhatsApp, função **"Colaborador" (travada)**, nº+nome do PG | ☐ |
| 2 | "Entrar na Jornada" | Entra como Colaborador no PG certo | ☐ |
| 3 | Ver a Home | Visão de participante — **SEM** Bloco de Liderança (não vê Convidar/Painel) | ☐ |
| 4 | Abrir "Painel da Comunidade" | Mural funciona (gratidão / oração / celebração) | ☐ |

### FASE 4 — Testes de Robustez
*(concorrência, sincronização e consistência — não só funcionalidade básica)*
| # | Teste | Esperado | OK |
|---|---|---|---|
| A | Abrir o **mesmo link** de convite de novo (outra pessoa) | "Convite já utilizado" | ☐ |
| B | **2 aparelhos, mesmo link, tocar "Entrar" juntos** | **Só um entra**; o outro vê "já utilizado" — **sem duplicata** | ☐ |
| C | Coordenador **revoga** convite pendente → tentar usar | "Convite cancelado" | ☐ |
| D | Postar gratidão/oração num aparelho | Aparece nos outros aparelhos do grupo (sincroniza) | ☐ |
| E | Conferir progresso do PG após ações | Atualiza corretamente entre dispositivos | ☐ |

*(Expiração de 7 dias: impraticável esperar — já validado por simulação; pode pular.)*

### FASE 5 — Encerramento
| Item | Verificação | OK |
|---|---|---|
| Banco consistente | ☐ | |
| Nenhum convite pendente indevido | ☐ | |
| Participantes corretos | ☐ | |
| Grupo criado corretamente | ☐ | |
| Backup pós-homologação realizado | ☐ | |
| BUGs registrados | ☐ | |

## Regra da homologação

**Nenhuma correção entra diretamente na RC1.** Cada problema encontrado vira um registro `BUG-XXX`
abaixo. Só depois de terminar a homologação (ou de acumular um lote) é que as correções são
aplicadas de uma vez e — se necessário — gera-se uma RC2. Isso evita que a RC1 "mude debaixo dos
pés" durante os testes.

## Critério para sair da RC1

A fase de homologação se encerra quando ocorrer uma destas duas situações:

1. **Nenhum `BUG-XXX` crítico encontrado**; ou
2. **Os `BUG-XXX` encontrados foram corrigidos em uma RC2 e todos retestados com sucesso.**

Até lá, a RC1 permanece congelada: sem funcionalidade nova, sem refatoração — só registro e,
quando decidido, correção em lote dos bugs encontrados.

## Bloqueios (release blockers)

Achados que impedem o início da homologação operacional — encontrados **antes** de abrir os testes
com usuários reais, durante a revisão da tela de entrada da RC1.

---

### BLOCKER-001

- **Título:** Fluxo antigo de autocadastro permanece ativo
- **Severidade:** Crítica (bloqueia homologação)
- **Descoberto em:** 2026-07-02, revisão da tela de boas-vindas antes de abrir a homologação
- **Passos para reproduzir:** Abrir o link base do app (sem `?conv=`) num aparelho que nunca
  completou o cadastro → aparece a tela antiga de 3 passos ("Qual é o seu nome" / "Como você se
  identifica" / "Escolha seu Pequeno Grupo") em vez de exigir convite.
- **Resultado esperado:** Sem convite válido, ninguém escolhe papel nem grupo — só recebe
  orientação para pedir um convite ao Coordenador/Tutor.
- **Resultado obtido:** `confirmarInscricao()` (linha 8361) permite que qualquer visitante se
  autodeclare Tutor, Coordenador ou Colaborador de **qualquer** PG existente — inclusive o Grupo 1
  real — sem nenhuma verificação de convite. Confirmado por leitura de código, sem necessidade de
  reproduzir contra produção.
- **Impacto:** Contorna por completo a cadeia de autoridade Tutor → Coordenador → Colaborador
  construída na Etapa 2 (convites) e no PERM-01. A Etapa 2 só desativou o link curto `?pg=N`; essa
  porta de autocadastro nunca foi desligada.
- **Correção esperada:** Desativar completamente o fluxo de autocadastro; ingresso somente mediante
  convite válido.
- **Mapa de impacto (2026-07-02):** `openGrupos()` era o único ponto de entrada da lista pública de
  grupos, chamado por: tela de boas-vindas antiga (passo 3), botões "Escolher meu Pequeno
  Grupo"/"Trocar grupo" na Home, e o atalho interno `?tela=grupos`. `confirmarInscricao()`
  (autocadastro em si) também é o único mecanismo hoje capaz de ativar um PG novo (dos 44 ainda
  vazios) — dependência identificada e **deliberadamente não resolvida agora** (decisão do
  usuário): o Grupo 1 já ativo é suficiente para a homologação; um fluxo administrativo de
  ativação de PG fica para depois da homologação, não acessível ao usuário comum.
- **Correção aplicada:** `openGrupos()` redefinida para mostrar a mensagem "Convite necessário"
  (reaproveita `telaConviteMensagem`/`mensagemConvite`, novo caso `sem_convite`) em vez de listar
  grupos — fecha automaticamente **todos** os chamadores de uma vez (tela antiga, botões da Home,
  atalho `?tela=grupos`). Fallback do `initApp()` (sem convite, cadastro não concluído) e
  `irParaInicioLimpo()` também trocados da tela antiga para a mesma mensagem. `confirmarInscricao`,
  `selectProfile`, `startJourney` e o HTML da tela antiga **não foram apagados** — ficam inertes
  (nenhum caminho os alcança mais), remoção física fica para uma limpeza de código morto futura,
  fora do escopo deste blocker. Verificado no preview: sem convite → só a mensagem, sem escolha de
  perfil/grupo; "Ir para o início" não retorna à tela antiga; sem erros de console; fluxo de
  convite (`?conv=`) não foi tocado.
- **Checklist de regressão (2026-07-02, testado no preview local, rede real neutralizada
  via `syncFromFirebase`/`saveGruposToFirebase`/`fbReadDoc` antes de qualquer manipulação —
  nenhuma escrita em produção):**

  | # | Cenário | Resultado |
  |---|---|---|
  | 1 | Link base do app (sem convite) | ✅ Só "Convite necessário" |
  | 2 | Convite de Coordenador válido | ✅ Abre direto o cadastro, papel "Coordenador" e grupo "CAPELANIA" pré-definidos (🔒), sem escolha de perfil/grupo |
  | 3 | Convite de Colaborador válido | ✅ Idêntico ao Coordenador, papel "Colaborador" pré-definido |
  | 4 | Convite expirado | ✅ Mensagem "Convite expirado" (comportamento pré-existente, intocado) |
  | 5 | Convite inválido/inexistente | ✅ Mensagem "Convite indisponível" (comportamento pré-existente, intocado) |
  | 6 | Usuário já cadastrado (`welcomeDone=true`) | ✅ Entra direto na Home, tela de convite não fica ativa |

  Console sem erros e sem requisições falhas em todos os 6 cenários.
- **Commit:** `188a56f` ("conserto da página")
- **Retestado:** ✅ 2026-07-02 — 6/6 cenários da checklist de regressão aprovados (ver tabela acima).
- **Observação de fechamento:** BLOCKER-001 resolvido **antes** do início da homologação
  operacional. Não integra a lista de `BUG-XXX` encontrados durante a homologação por ter sido
  identificado previamente ao início dos testes de campo — a homologação já começa com a
  arquitetura de convites efetivamente aplicada, sem a coexistência do fluxo legado de
  autocadastro.

---

### BUG-001

- **Título:**
- **Severidade:** crítico / médio / baixo
- **Passos para reproduzir:**
- **Resultado esperado:**
- **Resultado obtido:**
- **Correção:**
- **Commit:**
- **Retestado:**

---

## Assinatura da homologação

**Homologação operacional RC1**

- Data: ____________________
- Tutor: ____________________
- Coordenador: ____________________
- Responsável pela validação: ____________________

Resultado:
- ☐ Aprovada
- ☐ Aprovada com ressalvas
- ☐ Reprovada
