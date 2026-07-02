# Homologação Operacional — RC1

> Referência: `ESTADO-E-ROADMAP.md` (seção "Release Candidate RC1"). Baseline de restauração:
> tag `v3-rc1-baseline` + snapshot `BASELINE-RC1-2026-07-02.json`
> (`C:\Users\wladimir.souza\Documents\backups-firebase-jdpg\`).

## Checklist de testes

| Item | Status | Observações |
|---|---|---|
| Tutor gera convite | ☐ | |
| Coordenador aceita convite | ☐ | |
| Coordenador gera convite de colaborador | ☐ | |
| Colaborador ingressa no PG | ☐ | |
| Mural de Gratidão | ☐ | |
| Pedido de oração | ☐ | |
| Atualização em tempo real | ☐ | |
| XP e progresso | ☐ | |
| Sincronização entre dispositivos | ☐ | |
| Logout/Login | ☐ | |
| Reconexão após perda de internet | ☐ | |

Marcar ☑ quando passar, ✗ quando falhar (e abrir um `BUG-XXX` na seção abaixo).

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
- **Commit:** _(pendente — aguardando você revisar/commitar pelo GitHub Desktop)_
- **Retestado:** ✅ 2026-07-02 — 6/6 cenários da checklist de regressão aprovados (ver tabela acima).
  Falta apenas o commit para fechar definitivamente.
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
