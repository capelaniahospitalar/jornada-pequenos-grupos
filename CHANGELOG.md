# CHANGELOG — Jornada Discipular em Pequenos Grupos

## [2026-07-02] — RC2: convite automático do Coordenador ao criar o PG (ARCH-03)

Etapa 3 da RC2. Resolve a identidade dupla de "quem é o Tutor" que impedia um Tutor puro-admin
(sem registro de participante, criado na Etapa 2) de gerar o convite do Coordenador.

- `gerarConvite()` (branch `coordenador`): aceita autoridade por 2 vias — participante papel
  `'tutor'` (legado, intocado) ou nova `souTutorAdminDoGrupo()` (`ST.tutorPanelAuth` bate com
  `g.tutor`). `deNome` do convite usa o nome canônico do Tutor quando só a via admin autoriza.
- `validarConviteParaAceite()`: contrapartida obrigatória no lado do aceite, mesma lógica de 2
  vias — sem ela, o convite seria gerado mas nunca poderia ser aceito. Fluxo de `colaborador`
  (emitido por Coordenador) não foi tocado.
- `getMinhaFuncaoNoGrupo()` **não foi alterada** — evita qualquer risco no fluxo comum
  (`openShare()`, usado por Colaborador/Coordenador via Home).
- Nenhum Tutor artificial criado em `participantes[]`.
- Convite do Coordenador agora é gerado **automaticamente** logo após criar o PG
  (`confirmarCriarPg` → `gerarConvidarCoordenadorAutoEExibir`) — verifica convite pendente
  existente antes (não duplica), mostra link pronto + WhatsApp em caso de sucesso, e uma tela
  própria com botão de tentar novamente em caso de falha (nunca silenciosa).
- **Limitação documentada:** autoridade administrativa usa nome canônico, não ID estável —
  melhoria futura é migrar para um identificador da allowlist.
- Testado: geração via admin, aceite completo pelo Coordenador, reaproveitamento de convite
  pendente, falha simulada + retry, fluxo legado (participante) sem regressão.

---

## [2026-07-02] — RC2: criação de Pequenos Grupos pelo Tutor (ATIVACAO-01)

Etapa 2 da RC2. Um Tutor autenticado pela allowlist (Etapa 1, `ARCH-02`) já pode criar Pequenos
Grupos de verdade, sem reativar nenhum autocadastro.

- `renderCriarPgForm()` + `confirmarCriarPg()` — nome do grupo (obrigatório), dia/horário
  (opcionais); usa `getProximoGrupoVazio()` (já existente, reaproveitada) para achar o próximo dos
  50 slots fixos ainda livre; grava com `saveGrupos()`, herdando de graça a trava de concorrência
  já testada (precondição + retry) — nenhum código novo de concorrência.
- Estado sem grupos → "➕ Criar Primeiro Pequeno Grupo"; estado com 1+ grupos → lista normal +
  "➕ Criar outro Pequeno Grupo", **só visível para quem é Tutor de pelo menos um deles** — um
  Coordenador autenticado no mesmo painel nunca cria grupo.
- Uma única função de criação para os dois estados — sem duplicar fluxo.
- Placeholder da Etapa 1 (`abrirCriarPrimeiroPg`/`alert`) removido.
- **Fora do escopo, registrado como pendência (`ARCH-03`):** convite automático do Coordenador ao
  criar o grupo — depende de resolver antes uma inconsistência entre duas checagens de "quem é
  Tutor" (`g.tutor` string vs. lista de `participantes`), usadas por partes diferentes do app.
- Testado: criação com zero grupos, criação de um segundo grupo, bloqueio correto para
  Coordenador, console limpo.

---

## [2026-07-02] — RC2: acesso administrativo do Tutor independente de grupo/dispositivo (ARCH-02)

Início do desenvolvimento da RC2 (RC1 encerrada — ver `ESTADO-E-ROADMAP.md`). Primeira etapa:
elimina a dependência circular que impedia um Tutor autorizado, mas sem nenhum Pequeno Grupo
ainda, de acessar o Painel do Tutor pela primeira vez num aparelho novo.

- Novo ponto de entrada `?tutor`, checado em `initApp()` antes do roteamento normal — funciona
  independente de `welcomeDone` ou de já ter um grupo.
- `estaNaAllowlistTutores()` agora retorna o registro encontrado (nome canônico) em vez de só
  `true`/`false` — a allowlist `tutores` passa a ser a fonte de verdade para autenticar um Tutor,
  não mais a existência prévia de um grupo. Mudança retrocompatível, não afeta o caller existente
  (`gerarConvite`).
- `tutorIdentificar()` não bloqueia mais quem ainda não tem grupo.
- `tutorConfirmarCriarPass()` aceita a allowlist como prova de identidade alternativa quando não
  há registro de participante para conferir o WhatsApp.
- `renderTutorGruposList()`: quem está autorizado mas sem grupo vê "➕ Criar Primeiro Pequeno
  Grupo" (placeholder — implementação completa é a próxima etapa, `ATIVACAO-01`) em vez de uma
  mensagem de erro.
- Sem duplicar a lógica de login: uma única variável (`tutorPanelOrigem`) decide só a exibição do
  botão "voltar", reaproveitando as mesmas funções de identificação/senha/dashboard para as duas
  origens (Home e `?tutor`).
- Testado: fluxo existente (Home) sem regressão; `?tutor` com Tutor já-com-grupo; `?tutor` com
  Tutor novo (zero grupos); `?tutor` com dado que não bate na allowlist ("Acesso restrito").

---

## [2026-07-02] — Limpeza de código morto (FUNC-01, STR-01 a STR-05)

Commit de manutenção, sem alteração de comportamento observável pelo usuário.

- **FUNC-01:** removidas as 4 funções duplicadas (`sendMyPrayer`, `clearMyPrayer`,
  `openComunidade`, `enviarGratidao`) — em cada par, só a segunda declaração era
  executada; a primeira nunca rodava (JS sobrescreve funções de mesmo nome).
- Removida, junto, toda a cadeia de funções que só era chamada pela 1ª versão de
  `openComunidade`/`enviarGratidao` e por isso também nunca executava:
  `renderComunidadeScreen`, `renderGratCard`, `timeAgoGrat`, `setMuralFiltro`,
  `setPostTipo`, `getMinhasReacoes`, `reagirGratidao` e as variáveis `muralFiltro`,
  `postTipoSelecionado`, `GRAT_REACOES_KEY`.
- **STR-05:** removido o `if (window._conviteGrupoNum)` em `startJourney()` — a
  variável nunca era definida em lugar nenhum do código (resíduo do fluxo `?pg=N`
  removido na Etapa 2), condição sempre falsa.
- **STR-01/STR-03:** excluído `revisao.html` (arquivo órfão, não referenciado por
  nada, continha o link duplicado do STR-03).
- **STR-02:** removido `.claude/launch.json` (apontava para um caminho de sessão
  antigo que não existe mais).
- **STR-04:** removida a constante `TUTOR_PANEL_URL`, declarada e nunca usada.
- Verificado: nenhuma função duplicada remanescente (busca global); app carrega sem
  erros no console e sem requisições falhas.

---

## [2026-06-29] — Corrige perda do mural em conflito Firebase (FB-C3, regressão)

### ALTO corrigido — `gratidoes` (mural) apagado/perdido no merge

A reescrita via GitHub reverteu a correção FB-C3. Dois problemas no caminho de
conflito de `saveGruposToFirebase`:

1. **Write descartava o mural.** `dadosMerged` não incluía `gratidoes`, então toda
   gravação pós-conflito **apagava os posts do mural na nuvem**. Corrigido: `dadosMerged`
   agora inclui `gratidoes` (igual ao caminho normal `dadosSalvar`).
2. **Merge não unia o mural.** `mergeGruposData` só preservava as `gratidoes` do remoto
   (via `...rg`), perdendo posts locais ainda não sincronizados. Corrigido: agora **une**
   remoto + local com dedup por `id` (mesma lógica já usada para participantes).

Conflito = dois aparelhos gravando entre syncs (tutor + participantes ao mesmo tempo) —
cenário comum. Verificado em runtime: merge de remoto[id:1] + local[id:2,id:1] → `[1,2]`
(une e deduplica).

---

## [2026-06-29] — Validação de tamanho de entradas (R-M04)

### MÉDIO corrigido — guarda de tamanho + maxlength

**Guarda no save (a parte importante).** Existe um único documento Firestore
compartilhado por todos os grupos; a regra rejeita `dados` ≥ 500 KB. Antes, um write
acima do limite falhava **silenciosamente para todos**. Agora `fbWriteGrupos()` mede o
tamanho do `dados` (`JSON.stringify`) e, se passar de **480 KB**, cancela o write e
avisa o usuário (`alert`, com throttle de 60 s para não repetir). Transforma perda
silenciosa em aviso claro.

**`maxlength` nos campos que sincronizam** (prevenção na origem):

| Campo | Limite |
|-------|--------|
| Nome do grupo (`insc-grupo-nome-input`) | 40 |
| Departamento (`insc-dept`) | 40 |
| Nome do participante (`insc-nome`, `troca-papel-nome`) | 80 |
| Nome do usuário (`user-name-input`, `tp-nome-input`) | 80 |
| Pedido de oração ao companheiro (`my-prayer-input`) | 300 |
| Post do mural (`grat-input`, 2 composers) | 500 |

Invisível no uso normal; só limita ao atingir o teto. Não afeta diário pessoal nem
campos não sincronizados.

Verificado: app carrega sem erros; `fbWriteGrupos`/`fbWarnTooLarge` definidas;
`maxlength` confirmado no DOM.

---

## [2026-06-29] — Varredura XSS ampla (mural, grupos, bandeirola)

### ALTO corrigido — XSS em campos controlados por usuário (innerHTML)

Auditoria sistemática dos `innerHTML` que renderizam dados de usuário. A reescrita
via GitHub havia reintroduzido pontos sem escape (a correção C01 da auditoria anterior
se perdeu). Aplicado `sanitize()` nos vetores **cross-user** (onde um usuário injeta
script que executa no navegador de outro):

| Função | Campo |
|--------|-------|
| `renderComunidade` (mural sincronizado) | `item.autor`, `item.data`, `item.texto` |
| `renderGratCard` (mural local) | `g.texto` (`g.nome` já estava ok) |
| `renderGrupoDetalhe` (card de status) | `g.nome`, `g.tutor`, `g.coordenador` |
| `renderGrupoSelecionadoPreview` | `meuGrupo.grupoNome`, `g.tutor`, `g.coordenador` |
| lista de participantes inscritos | `p.nome` |
| painel de envio ao tutor | `d.nome` (2 pontos) |
| convite por link (welcome) | `g.nome` |
| **`generatePennantSvg`** | nome do grupo dentro de `<text>` do SVG |

> **Destaque:** a bandeirola (`generatePennantSvg`) inseria o nome do grupo direto no
> markup SVG — um nome com `<` permitia injeção. Agora escapado. Verificado em runtime:
> nome `<img onerror>` aparece escapado, não cru.

**Deixados intencionalmente sem `sanitize`:**
- Campos via `.textContent =` (ex.: `insc-grupo-tutor`) — já seguros; sanitizar
  mostraria entidades literais (`&amp;`).
- Nomes de nível/missão e `enc.texto` — conteúdo constante do código (currículo).
- Diário pessoal (`saved[pi]`) — self-XSS, não sincroniza para outros.

Verificação: app carrega sem erros; todas as funções editadas parseiam; teste de
injeção na bandeirola confirmado neutralizado.

---

## [2026-06-29] — Sanitização XSS na área do Companheiro de Jornada

### ALTO corrigido — XSS na nova tela de Companheiro

A reescrita do "Companheiro de Jornada" (ver seção abaixo) passou a renderizar
nomes, departamentos e pedidos de oração de participantes via `innerHTML` **sem
escape**. Como esses campos vêm do cadastro/entrada do usuário, um valor com
HTML (ex.: `<img onerror=...>`) seria executado. Aplicado `sanitize()` em 8
pontos:

| Local (função) | Campo sanitizado |
|----------------|------------------|
| `renderCompanionSelector` — convite recebido | `c.de` (nome de quem convidou) |
| `renderCompanionSelector` — membro do grupo | `p.nome` |
| `renderCompanionSelector` — membro do grupo | `p.departamento` |
| `renderCompanionDashboard` — botão de oração | `p.name.split(' ')[0]` |
| `renderCompanionDashboard` — caixa de pedido | `p.prayerRequest` (texto livre — maior risco) |
| `renderCompanionDashboard` — nome do parceiro | `p.name` |
| `renderCompanionDashboard` — compositor de oração | `p.name.split(' ')[0]` |
| `renderCompanionHomeBtn` — botão da home | `p.name.split(' ')[0]` |

> Os argumentos dentro de `onclick="...(...)"` já estavam protegidos pela função
> `escAttr()` (contexto de string JS), então não precisaram de `sanitize`.

### Limpeza — remoção do `_TUTORS_BOOTSTRAP`

Removidos o array `_TUTORS_BOOTSTRAP` (4 capelães com WhatsApp hardcoded), a função
`seedTutorsToFirebase()` e seu chamador na inicialização. O campo `tutores` já está
populado no Firestore (verificado no Console), então o seed virou código morto. O
runtime carrega `TUTORS` do Firestore em `syncFromFirebase()`. Tira PII do código-fonte
público; não afeta o funcionamento.

> Ressalva honesta: não torna os telefones privados — eles permanecem legíveis via
> Firestore (`read: if true`) e no campo `dados`. É limpeza de código + redução de
> exposição no repositório, não correção de privacidade.

### Verificações de Console (sem mudança de código)

- **Firestore Rules:** confirmadas já endurecidas (não em modo teste). Resolvido.
- **API Key:** confirmada restrita a `capelaniahospitalar.github.io/*` + `localhost/*`. Resolvido.

---

## Mudanças anteriores (commits `637d407`..`d8806e3`, via GitHub) — documentadas retroativamente

Estas entraram fora de uma sessão de manutenção assistida; registradas aqui para histórico.

### Reescrita do Companheiro de Jornada
- De escolha local (`CP.companionIdx`) para **convite mútuo entre participantes
  do grupo**, sincronizado via Firebase.
- Novos campos no participante: `compParceiro`, `compConvites`.
- Novas funções: `cpMyGroup`, `cpFindParticipant`, `cpMyParticipant`,
  `cpDisplay`, `escAttr`, `inviteCompanion`, `acceptCompanion`,
  `declineCompanion`, `removeCompanion`.
- Pedido de oração agora gravado no participante (`pedidoOracao`) para o
  companheiro visualizar pela nuvem.

### Progresso semanal passou a ser do grupo
- `getPgGroupWeek()` soma as contribuições (`contrib` com `weekKey`) de todos os
  participantes da semana ISO.
- `bumpPgProgress` grava contribuição individual com `updatedAt`; "semana
  completa" agora exige as **metas do grupo**.
- Meta de estudos: 3 → 1; na home, estudos vira "progresso da jornada" `x/13`.
- `getOrInitPgProgress` deixou de persistir ao apenas inicializar (evita
  sobrescrever Firebase antes da sync).

### Endurecimento do Firebase
- **Proteção anti-apagamento:** nunca grava lista vazia local sobre nuvem com
  dados — recupera da nuvem.
- Merge de participantes mantém a versão mais recente por `updatedAt`.
- `fbLastKnownTs` setado após `applyGruposData` (mais seguro se aplicar falhar).
- Null-safe em `p.nome` na deduplicação.

---

## [2026-06-26] — Auditoria de Segurança e Confiabilidade (Sessões 1 e 2)

Detalhamento completo das 22 correções (C01–C07, A04–A15, FB-C3, M04, M11)
preservado na memória persistente do projeto (`project_security_audit.md`).
