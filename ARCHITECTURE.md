# Jornada Discipular em Pequenos Grupos

## Arquitetura Oficial

| | |
|---|---|
| **Versão arquitetural** | `v3.4a.1-homologado` |
| **Última atualização** | 2026-07-27 |

> Este documento registra **exclusivamente** o que já foi homologado e o roadmap arquitetural
> aprovado. Propostas em discussão, funcionalidades ainda não implementadas ou decisões
> rejeitadas não entram aqui — isso vive na conversa/planejamento, não na arquitetura oficial.
> É um **mapa vivo**: atualizado a cada nova homologação, não uma fotografia de uma data única.

---

## Objetivo do Projeto

Aplicativo de acompanhamento dos Pequenos Grupos (PGs) da Capelania do Hospital Adventista
Silvestre — uma jornada de discipulado de 13 estudos para participantes, com tutores e
coordenadores por grupo, contadores compartilhados (oração, bondade, estudos), sincronização
via Firebase, e — a partir do Épico 3 — um índice de acompanhamento pastoral da maturidade
discipular de cada PG (IMD).

---

## Princípios Arquiteturais

- Desenvolvimento incremental, por RCs (Release Candidates) — uma responsabilidade por RC.
- Homologação antes de iniciar a próxima funcionalidade.
- Separação entre cálculo e interface (nenhuma tela recalcula o que o motor já calculou).
- Separação entre leitura e gravação (painéis de consulta nunca escrevem no Firebase).
- Código desacoplado — cada camada pode ser testada e substituída isoladamente.
- Compatibilidade retroativa — campo novo é aditivo; nada existente é quebrado sem decisão explícita.
- Dados antes da interface — só existe tela para o que já é dado real, sincronizado no app.
- Inteligência (pastoral) antes da gamificação.

---

## Arquitetura em Camadas

```
Interface (UI)
        ↓
Serviços
        ↓
Motor de Negócio
        ↓
Persistência
        ↓
Firebase
```

> `index.html` continua sendo um único arquivo — estas são camadas **lógicas** (como as funções
> se organizam e dependem umas das outras), não uma separação física em pastas/módulos.

- **Interface (UI):** funções `render*` (ex.: `renderRankingPgs`, `renderTutorGrupoDetalhe`) —
  só montam HTML a partir do que as camadas de baixo já calcularam; nunca calculam nada sozinhas.
- **Serviços:** funções de orquestração acionadas por uma ação do usuário (ex.:
  `registrarEncontroPg`, `marcarFrequenciaPg`, `abrirRelatoriosMensais`) — conectam UI, motor de
  negócio e persistência.
- **Motor de Negócio:** cálculo puro, sem efeito colateral (ex.: `getPgIMD`, `classificarPgs`,
  `calcularComunhaoScore`, `getPgGroupWeek`) — recebe dado, devolve resultado, não grava nada.
- **Persistência:** leitura/gravação do estado local e da fila para a nuvem (ex.: `loadGrupos`,
  `saveGrupos`, `applyGruposData`, `trySaveGrupos`).
- **Firebase:** a nuvem em si — Firestore via REST (`fbReadDoc`, `fbWriteGrupos`).

Ao pensar numa funcionalidade nova, esta é a régua: "isso é tela, orquestração, cálculo ou
gravação?" — cada resposta aponta para uma camada diferente, e nenhuma camada deve fazer o
trabalho da outra.

---

## Componentes Homologados

### IMD — Índice de Maturidade Discipular

- **Descrição:** mede o discipulado vivido por um PG, não sua posição relativa a outros.
- **Responsabilidade:** calcular, por grupo, 5 dimensões (0–100) a partir de dado real já
  existente no app — nunca inventa número onde falta dado (esses pontos ficam marcados como
  "EXTENSÃO:" no código).
- **Dimensões:** Comunhão, Relacionamento, Missão, Crescimento, Fidelidade.
- **Principais objetos:** `pgIMD` (por grupo), `PG_IMD_WEIGHTS` (peso de cada dimensão no
  `totalScore`), `PG_IMD_SUBWEIGHTS` (peso interno de cada sinal dentro de uma dimensão),
  `MAX_STREAK_DAYS` (teto de constância).
- **Funções:** `getPgIMD(grupoNum)` calcula em memória (não persiste); `atualizarPgIMD(grupoNum)`
  calcula e grava em `g.pgIMD`.

### Motor de Classificação

- **Responsabilidade:** ordenar todos os PGs formados a partir do `pgIMD` de cada um.
- **Critérios de desempate** (nesta ordem): maior IMD → maior Comunhão → maior Missão → maior
  Fidelidade → maior Relacionamento → maior Crescimento → persistindo empate, mesma posição.
  Nunca sorteio, nunca vencedor inventado.
- **Empates:** ranking no padrão de classificação esportiva (`1, 2, 2, 4` — nunca `1, 2, 3, 4`
  forçado).
- **Percentil:** calculado junto com o rank (percentual de PGs que aquele grupo supera ou empata).
- **Trend:** campo reservado, hoje sempre `"stable"` — só ganha `"up"/"down"` quando existir
  histórico de classificações anteriores para comparar (ainda não implementado).
- **Funções:** `classificarPgs()` (pura, recalcula tudo em memória, não persiste);
  `atualizarPgRanking()` (persiste em `g.pgRanking`).

### Painel do Tutor — Ranking dos Pequenos Grupos

- **Somente leitura:** abrir o painel nunca grava no Firebase.
- **Fonte única de dados:** `classificarPgs()` — a interface não reordena nem recalcula nada.
- **Acesso:** exclusivo a Tutor/Coordenador (mesmo portão de acesso do Painel do
  Tutor/Coordenador já existente); participante não vê essa tela.
- **Lista completa:** todos os PGs com dado, não só um Top N.
- **Sem gamificação visual:** sem medalha animada, barra, gráfico, nível ou efeito — só os
  números que o motor já calcula, mais o emoji de posição (🥇🥈🥉) para os 3 primeiros.

### Cobertura Setorial Institucional (RC4.8.2 / RC4.8.2A / RC4.8.3 / RC4.8.5A)

- **Descrição:** mede quanto de cada setor institucional (RH, Jurídico, DP, NCP etc.) está
  coberto por colaboradores matriculados nos PGs — indicador oficial do ADV-E. Um PG pode
  representar um ou vários setores.
- **Quatro responsabilidades deliberadamente separadas** (ver ADR-001 e ADR-002, seção
  "Registro de Decisões Arquiteturais"):
  1. **Cadastro Mestre de Setores** (`SETORES_MESTRE`) — só identidade institucional:
     `{setorId, nome, ativo, departamentoPaiId}`. `setorId` é estável e nunca reaproveitado;
     `nome` é só exibição, nunca usado como chave de referência (mesma diretriz já adotada
     para tutor/coordenador — ver "RC4 — Identidade Canônica dos Responsáveis" no
     `ESTADO-E-ROADMAP.md`). `ativo` e `departamentoPaiId` (hierarquia/agrupamento por
     grande área) são campos reservados, sem comportamento implementado ainda.
  2. **Efetivo Institucional dos Setores** (`SETORES_EFETIVO`) — componente compartilhado,
     não exclusivo do Painel ADV-E: qualquer indicador institucional futuro que precise saber
     "quantos colaboradores este setor tem" (Embaixadores, Escola Sabatina, treinamentos
     obrigatórios, capelania etc.) usa a mesma fonte. `{setorId, totalColaboradores,
     atualizadoEm, historico[]}` — `totalColaboradores`/`atualizadoEm` são só o "ponteiro
     atual"; `historico[]` é **append-only** (editar nunca sobrescreve uma entrada, sempre
     empilha uma nova), com cada entrada já no formato de registro versionado: `{registroId,
     setorId, totalColaboradores, atualizadoEm, origem, usuario, observacao}`.
  3. **Setores Acompanhados pelo PG** (`g.setores`) — **não é "os setores que este PG tem"**;
     é uma **decisão ministerial do coordenador**: quais setores institucionais este PG se
     propõe a atender, declarada mesmo antes de existir qualquer participante daquele setor
     (por isso um setor pode aparecer com 0 matriculados — é um alvo de cobertura, não um
     resumo do que já existe). Continua sendo, internamente, um array de `setorId`
     (referência ao Cadastro Mestre), mas nenhuma documentação ou código novo deve tratá-lo
     como sinônimo de "setores presentes entre os participantes".
  4. **Participantes do PG** — só contam para as estatísticas de um setor se pertencerem a um
     dos setores acompanhados pelo próprio PG (item 3). Este é um **invariante do sistema**,
     não uma regra local do Embaixadores: `participanteContaParaSetor(g, p, setorId)` é a
     única função que qualquer código (presente ou futuro) deve usar para essa checagem —
     nunca cruzar participante e setor "por fora" dela. Um participante cujo `setorId` não
     está entre os setores acompanhados pelo seu próprio PG é uma **inconsistência de
     cadastro** (não deve contar em lugar nenhum) — ver ADR-002.
- **Cobertura Setorial** — `calcularCoberturaSetorial(grupoNum)`. **Nunca persistida** —
  cálculo puro, recalculado ao vivo a cada abertura de tela, mesmo padrão do `getPgIMD`. Usa
  `participanteContaParaSetor()` para contar matriculados; classifica 🟢 (≥`PG_COBERTURA_META_PCT`,
  40%) / 🟡 (≥75% da meta, 30–39%) / 🔴 (abaixo disso).
- **Proteções de consistência (RC4.8.5A):** (a) atribuir a um participante um setor fora dos
  acompanhados pelo PG exige confirmação explícita, que já inclui adicioná-lo à lista de
  acompanhados (`atribuirSetorParticipante`); (b) remover um setor acompanhado é bloqueado
  enquanto existir participante do PG vinculado a ele (`excluirSetor`) — nunca deixa um
  participante "órfão" de setor por trás de uma exclusão.
- **Migração:** `migrarSetoresParaMestre()` — idempotente, normaliza o formato antigo
  (RC4.8.2: setor como objeto local ao PG) para o modelo de componentes atual, sem perder a
  atribuição de setor já feita por participante.
- **Sincronização:** `g.setores` (lista de `setorId` por PG) sincroniza como qualquer campo
  de grupo; `SETORES_MESTRE`/`SETORES_EFETIVO` sincronizam como campos de topo próprios
  (`setoresMestre`/`setoresEfetivo`), mesmo padrão de `TUTORS`/`tutores` — **exigem entrar na
  allowlist da regra do Firestore (`hasOnly([...])`)** antes de irem para produção, senão a
  gravação falha com 403 silencioso (mesmo bug já visto com o campo `convites`).

### Participação Institucional no Embaixadores da Esperança (RC4.8.5A, redefinida na RC4.8.3B)

- **Descrição:** mede, por setor, quantos colaboradores participaram do evento mensal do
  Embaixadores da Esperança — somando quem já é participante de PG (calculado
  automaticamente, via `participanteContaParaSetor()`) com uma quantidade manual de
  "participantes externos" (colaboradores do setor que não estão em nenhum PG).
- **Dois níveis de uso (redefinição da RC4.8.3B, 2026-07-27) — "toda informação nasce no PG,
  toda consolidação nasce no Painel ADV-E":**
  1. **Nível operacional, dentro do PG** (`renderPainelIndicadoresPorSetor`, dentro de
     `renderTutorGrupoDetalhe`) — fundido com a Cobertura Setorial num único "📈 Indicadores
     por Setor" (RC4.8.3B, segunda revisão, 2026-07-27): para cada setor acompanhado, os dois
     indicadores aparecem juntos (Pequenos Grupos + Embaixadores), cada um com barra de
     progresso — o coordenador olha um setor por vez, não um módulo por vez. É aqui que ele
     lança participantes externos (`iniciarEditarEmbaixadoresPg` /
     `confirmarParticipantesExternosPg`) — ele nunca precisa sair do seu PG.
  2. **Nível institucional, só consulta** (`renderEmbaixadoresInstitucional`) — deixou de ter
     qualquer campo editável; consolida por setor, cross-PG, para o ADV-E acompanhar. O
     detalhamento por PG dentro de cada setor (quanto cada PG específico contribuiu) fica
     para a RC4.8.4 (Painel ADV-E) — hoje mostra só o total consolidado.
- **Meta institucional própria:** `EMBAIXADORES_META_PCT = 20` (confirmada na homologação da
  RC4.8.5A), classifica 🟢 (≥20%) / 🟡 (≥15%, 75% da meta — **suposição desta RC, nunca
  especificada explicitamente**, mesma proporção usada em `PG_COBERTURA_META_PCT`) / 🔴
  (abaixo disso). Achado ao implementar o painel único: os limiares originais (copiados da
  Cobertura Setorial, 30–40%) marcariam 25% como 🔴, contradizendo o próprio exemplo dado
  para esta RC (25% → 🟢) — corrigido para usar a meta própria do Embaixadores.
- **Solução transitória e deliberadamente simples (ver ADR-002):** `EMBAIXADORES_EXTERNOS`
  guarda só a quantidade por `{setorId, monthKey}` — nunca nome, nunca lista de pessoas,
  nunca histórico individual. Isolado de propósito, sem nenhuma referência a
  `PEQUENOS_GRUPOS` — uma futura evolução (Cadastro Institucional de Colaboradores) pode
  substituir esta quantidade manual sem exigir migração desta estrutura. Continua sendo um
  dado institucional (por `setorId`, não por PG) mesmo sendo editado de dentro de um PG —
  se dois PGs acompanham o mesmo setor, ambos leem/gravam o mesmo registro.
- **Cálculo:** `calcularEmbaixadoresPorSetor(monthKey)` — cruza todos os PGs (não é um
  cálculo por PG, ao contrário da Cobertura Setorial), mas cada participante só conta se
  `participanteContaParaSetor()` for verdadeiro para o PG dele — nunca conta participante de
  setor fora dos acompanhados pelo seu próprio PG. `salvarParticipantesExternos()` é o
  validador/persistidor puro, compartilhado pelos dois níveis de uso.
- **Validação:** quantidade de externos nunca negativa, sempre inteira, e nunca deixa o total
  (PG + externos) ultrapassar o efetivo do setor — mensagem explica o máximo permitido.
- **Acesso ao nível institucional:** mesmo portão do Ranking dos PGs — qualquer
  Tutor/Coordenador, não é PG-específico (o app não tem papel de admin separado).
- **Sincronização:** campo de topo próprio (`embaixadoresExternos`), mesmo padrão dos demais
  — também precisa entrar na allowlist da regra do Firestore.

### Persistência

Campos por grupo (`PEQUENOS_GRUPOS[n]`), sincronizados como qualquer outro dado do grupo:

| Campo | Preenchido por | Observação |
|---|---|---|
| `pgIMD` | `atualizarPgIMD()` | Ainda não é chamada por nenhum evento automático — existe pronta. |
| `pgRanking` | `atualizarPgRanking()` | Idem — ainda não é chamada por nenhum evento automático. |
| `pgRanking.schemaVersion` / `pgIMD.schemaVersion` | idem | Versão do formato do objeto, para migração futura. |
| `pgRanking.displayName` | `atualizarPgRanking()` | Instantâneo do nome do grupo no momento do cálculo (não uma referência viva) — preserva "como o grupo se chamava naquela data" para histórico/relatórios futuros. |
| `g.setores` | `confirmarAdicionarSetor()`/`excluirSetor()`/`moverSetor()` | Lista de `setorId` — referências ao Cadastro Mestre, nunca objetos completos. |
| `SETORES_MESTRE` (campo de topo `setoresMestre`) | `confirmarAdicionarSetor()`/`confirmarEditarSetorMestre()` | Identidade institucional de setor — nunca contém total de colaboradores. |
| `SETORES_EFETIVO` (campo de topo `setoresEfetivo`) | `registrarEfetivoSetor()` | Estado operacional com histórico append-only — nunca sobrescreve uma entrada existente. |
| `EMBAIXADORES_EXTERNOS` (campo de topo `embaixadoresExternos`) | `registrarParticipantesExternos()` | Só quantidade por `{setorId, monthKey}` — nunca nome, nunca histórico individual (RC4.8.5A). |

---

## Fluxo de Dados

**Hoje (real, verificado em código):**

```
Painel do Tutor aberto
        ↓
classificarPgs()  (recalcula em memória, via getPgIMD() de cada grupo — não grava nada)
        ↓
Renderização (somente leitura)
```

**Alvo (aprovado, ainda não implementado — depende de decidir quais eventos disparam o
recálculo, ex.: encontro registrado, missão concluída, Embaixadores registrado):**

```
Evento no PG
        ↓
atualizarPgIMD()
        ↓
atualizarPgRanking()
        ↓
Painel do Tutor (classificarPgs(), somente leitura)
```

> Enquanto o lado "Evento →" não for implementado, `pgIMD`/`pgRanking` persistidos podem ficar
> desatualizados — isso não afeta o painel, que sempre recalcula ao vivo, mas é relevante para
> qualquer relatório futuro que vier a ler `g.pgIMD`/`g.pgRanking` direto do documento salvo.

---

## Governança

Fluxo oficial de toda mudança de arquitetura neste projeto:

```
Discussão → Proposta → Decisão → Implementação → Homologação → Documentação Definitiva → Memória
```

Item de auditoria aberto (RC3.2-A, ainda não executado): verificar se `pgProgress`, `pgNivel`,
badges, campanhas, streak e desbloqueios estão de fato sendo persistidos no Firebase — achado
durante o RC3.2, registrado para investigação futura, sem alterar comportamento até lá.

---

## Registro de Decisões Arquiteturais (ADR)

> Diferente do restante deste documento (que registra o "o quê" já homologado), um ADR
> registra o "porquê" de uma decisão — o problema, as alternativas descartadas e as
> consequências aceitas. Existe para que, meses depois, ninguém precise redescobrir por que
> uma estrutura de dados ficou "mais complicada do que parecia necessário".

### ADR-001 — Separação entre Identidade, Efetivo Operacional e Cobertura Calculada de Setores

**Data:** 2026-07-27 · **Status:** Aceito (RC4.8.2A)

**Problema:** a RC4.8 precisa medir a Cobertura Setorial dos PGs (indicador oficial do
ADV-E). A primeira modelagem (RC4.8.2) guardou nome e total de colaboradores dentro de cada
PG. A auditoria da RC4.8.1 identificou que isso reproduziria o mesmo defeito já corrigido na
RC-REST-02 (identificação de tutor por nome, não por id estável): dois PGs cadastrando "RH"
gerariam dois registros sem relação nenhuma entre si, impedindo agregação institucional
correta (double counting ou fragmentação do total). Uma correção intermediária (RC4.8.2A,
primeira versão) criou um Cadastro Mestre com `setorId` estável — mas ainda guardava
`totalColaboradores` junto da identidade, o que gerou um segundo problema: total de
colaboradores muda com o tempo (é um indicador operacional), enquanto nome/identidade é
permanente; misturar os dois faria uma edição de rotina (atualizar o efetivo) se comportar
como uma reescrita de identidade, e qualquer histórico ficaria preso ao mesmo registro,
sujeito a ser sobrescrito.

**Alternativas consideradas:**
1. Total de colaboradores por PG (modelo original da RC4.8.2) — descartada: permite que o
   mesmo setor institucional seja contado (ou digitado) de forma diferente em cada PG que o
   representa, sem nenhuma garantia de consistência.
2. Um único Cadastro Mestre com identidade + total de colaboradores embutido (primeira
   versão da RC4.8.2A) — descartada: mistura um atributo permanente (nome) com um valor
   operacional que muda com o tempo (total); editar o total destruiria/sobrescreveria
   qualquer histórico anterior, sem intenção.
3. **Três componentes com responsabilidade única cada — adotada:** identidade
   (`SETORES_MESTRE`), estado operacional com histórico append-only (`SETORES_EFETIVO`), e
   cobertura sempre calculada ao vivo, nunca persistida (`calcularCoberturaSetorial`).

**Decisão:** adotar a alternativa 3.
- Identidade nunca muda por causa de uma alteração de efetivo.
- Efetivo nunca é sobrescrito — toda alteração empilha um novo registro no histórico
  (`historico[]`), nunca modifica uma entrada existente.
- Cobertura nunca é persistida — é sempre derivada, no mesmo padrão já usado por `getPgIMD`
  (Motor de Negócio: cálculo puro, sem efeito colateral).

**Consequências positivas:**
- Um mesmo setor institucional pode ser reaproveitado por múltiplos PGs sem duplicar dado
  nem fragmentar o total (testado ao vivo: dois PGs representando "RH" compartilham o mesmo
  total institucional, cada um contando seus próprios matriculados independentemente).
- Renomear um setor não quebra nenhuma referência — mesma garantia já dada para
  tutor/coordenador (RC4 — Identidade Canônica).
- Alterar o efetivo de um setor preserva o dado histórico anterior, abrindo caminho natural
  para relatórios temporais assim que existir infraestrutura para isso (ver RC3.6, abaixo).
- Nenhuma tela recalcula o que o motor já calcula — mantém o princípio arquitetural já
  vigente no projeto ("Separação entre cálculo e interface").

**Limitações conhecidas:**
- Este modelo **não resolve sozinho** "qual era a cobertura em agosto" — isso exigiria também
  um snapshot histórico de quantos participantes cada PG tinha naquele mês, que ainda não
  existe (mesmo gap já registrado na RC3.6 para o IMD: "Evolução Discipular e Inteligência
  Temporal"). O histórico de efetivo é necessário, mas não suficiente, para reconstrução
  temporal completa — decisão explícita de não antecipar uma solução parcial só para
  setores, tratando isso como extensão futura da mesma RC3.6.
- `ativo` (Cadastro Mestre) e `departamentoPaiId` (hierarquia/agrupamento por grande área)
  estão reservados, sem nenhuma tela ou regra de negócio lendo esses campos ainda.
- Dois novos campos de topo no documento do Firestore (`setoresMestre`, `setoresEfetivo`)
  exigem atualização manual da allowlist da regra de segurança (`hasOnly([...])`) antes de
  produção — sem isso, a sincronização entre aparelhos desses dois campos falha
  silenciosamente (mesmo padrão de bug já visto com o campo `convites`, 2026-07-08).

### ADR-002 — Participante só conta para um setor se o PG dele o acompanha; Embaixadores como solução transitória isolada

**Data:** 2026-07-27 · **Status:** Aceito (RC4.8.5A)

**Problema:** ao desenhar o indicador institucional do Embaixadores da Esperança por setor
(RC4.8.5A), a primeira implementação cruzou participantes de **todos** os PGs com cada setor
do Cadastro Mestre, usando só `p.setorId === setorId`. Isso reabriu, por um caminho novo, o
mesmo tipo de inconsistência que a RC4.8.2A resolveu para o total de colaboradores: um
participante cujo setor não faz parte dos setores que o **próprio PG dele** declara
acompanhar (`g.setores`) era contado mesmo assim — por exemplo, um participante de
Enfermagem, cadastrado num PG que só acompanha RH/DP/Jurídico/NCP, inflaria indevidamente o
indicador de Enfermagem, mesmo sem nenhuma relação real entre aquele PG e aquele setor.

**Alternativas consideradas:**
1. Corrigir só o cálculo do Embaixadores (checar `g.setores` só ali) — descartada: a regra é
   um invariante do domínio, não uma particularidade de um indicador. Corrigir num só lugar
   deixaria a mesma armadilha aberta para o próximo relatório institucional (Painel ADV-E,
   Escola Sabatina, treinamentos) que algum dia precisar cruzar participante e setor.
2. Extrair uma função única (`participanteContaParaSetor`) que expressa o invariante uma
   única vez, usada por todo cálculo presente e futuro que cruze participante e setor —
   **adotada**.

**Decisão:** um participante só conta para as estatísticas de um setor quando (a) está
matriculado num PG, (b) esse setor está entre os setores que o **próprio PG dele** acompanha
(`g.setores`), e (c) satisfaz o critério específico do indicador (ex.: `embaixadores[mês]
.participou` para o Embaixadores). As condições (a)+(b) são o invariante genérico
(`participanteContaParaSetor`); (c) é responsabilidade de cada indicador. Duas proteções
adicionais fecham o ciclo: atribuir um participante a um setor fora dos acompanhados pelo PG
exige confirmação explícita (que já propõe incluir o setor); remover um setor acompanhado é
bloqueado enquanto existir participante do PG vinculado a ele.

Separadamente, a estrutura de dados dos "participantes externos" do Embaixadores
(`EMBAIXADORES_EXTERNOS`) foi deliberadamente modelada como **solução transitória isolada**:
só guarda uma quantidade por `{setorId, monthKey}`, nunca nome nem histórico individual, sem
nenhuma referência a `PEQUENOS_GRUPOS`. Uma futura evolução (Cadastro Institucional de
Colaboradores) pode substituir essa quantidade manual sem exigir migração desta estrutura.

**Consequências positivas:**
- O mesmo bug (participante contado fora do escopo do seu PG) não pode mais ser reintroduzido
  silenciosamente por uma tela nova — `participanteContaParaSetor` é o único caminho correto,
  e seu nome documenta a regra no próprio código.
- `g.setores` ganha um significado inequívoco na documentação: **setores acompanhados pelo
  PG** (uma decisão ministerial do coordenador, inclusive antes de existir qualquer
  participante daquele setor), nunca "setores que o PG tem hoje" — evita que uma futura
  derivação automática (cogitada e descartada na RC4.8.3B) apague setores-alvo com 0
  matriculados, que são justamente os mais relevantes para o ADV-E acompanhar.
- Testado com o cenário real que motivou a correção: participante de Enfermagem num PG que só
  acompanha RH/DP/Jurídico/NCP não conta em nenhum dos dois indicadores (Cobertura Setorial
  nem Embaixadores) até a inconsistência ser resolvida.

**Limitações conhecidas:**
- A confirmação de "incluir setor" usa `confirm()` nativo do navegador — os botões ficam com
  os rótulos padrão do navegador (não é possível renomear para "Adicionar setor"/"Cancelar"
  sem construir um modal próprio, o que não existe hoje em nenhuma parte do app).
- `EMBAIXADORES_EXTERNOS` é deliberadamente menos preciso que um cadastro individual (não
  sabe quem são os externos, só quantos) — aceito como suficiente para o indicador
  institucional agregado, não para qualquer relatório nominal futuro.
- Mais um campo de topo novo no Firestore (`embaixadoresExternos`) exige a mesma atualização
  manual de allowlist já registrada no ADR-001.

**Nota (redefinição da RC4.8.3B, 2026-07-27):** a primeira versão desta RC concentrou toda a
edição de participantes externos numa tela institucional separada. Revisão posterior
identificou que isso contrariava a própria lógica de "setores acompanhados pelo PG" — um
coordenador precisaria sair do seu PG e navegar por uma lista de setores da instituição
inteira (a maioria irrelevante pra ele) só para lançar um número do seu próprio contexto.
Corrigido com um princípio explícito: **toda informação nasce no PG; toda consolidação nasce
no Painel ADV-E.** A edição de `EMBAIXADORES_EXTERNOS` migrou para dentro de
`renderTutorGrupoDetalhe` (`renderEmbaixadoresPgSection`), ao lado da Cobertura Setorial,
usando os mesmos setores acompanhados; a tela institucional (`renderEmbaixadoresInstitucional`)
perdeu todo campo editável e virou consolidação somente leitura. Este princípio passa a valer
para qualquer indicador institucional futuro que precise de lançamento manual: o lançamento
mora no PG, a consolidação mora no painel institucional — nunca o contrário.

---

## Roadmap Arquitetural

### Épico 4 — Inteligência Pastoral (aprovado, não iniciado)

- RC4.1 — Painel de Saúde Discipular
- RC4.2 — Tendências (↑ ↓ →)
- RC4.3 — Histórico Mensal
- RC4.4 — Comparativo entre Ciclos
- RC4.5 — Alertas Inteligentes (ex.: PG sem encontro há 3 semanas, queda de Comunhão, grupo
  pronto para multiplicação, tutor sem atividade registrada)

### Épico 5 — Gamificação Discipular (aprovado, não iniciado)

- Níveis do PG, medalhas, conquistas, títulos, reconhecimento, celebrações, evolução do ciclo —
  preparação para a Semana da Primavera.
- Só inicia depois que o Épico 4 estiver consolidado (inteligência antes da gamificação).

### RC3.5 — Redesenho do IMD por Capilaridade Discipular (IMD v2 EM PRODUÇÃO desde a RC3.5.5 — RC3.5.4 HOMOLOGAÇÃO FUNCIONAL em andamento)

> RC3.5.1 (auditoria) → RC3.5.2 (proposta) → RC3.5.2A (decisões finais) → RC3.5.3 (implementação
> em modo de dupla avaliação) → RC3.5.4 (homologação operacional, indicadores da Fase 1) →
> **RC3.5.5 (entrada em produção — motor `getPgIMDv2`/`classificarPgsV2` é agora o ÚNICO IMD
> exibido na interface; motor antigo `getPgIMD`/`classificarPgs` preservado intocado no código,
> sem nenhuma tela chamando-o, só como rollback de contingência via `FB_FLAGS.imdV2 = false` —
> remoção definitiva prevista para o encerramento da RC3.6).**
> **Distinção formal entre homologação técnica e funcional (decisão do usuário):**
> - **Homologação TÉCNICA — concluída (RC3.5.3):** motor v2 isolado por feature flag, convivência
>   com o algoritmo antigo, painel de diagnóstico comparativo, tabela de distribuição dos
>   indicadores, conceito de Capilaridade, regra dos 3 indicadores, Fase de Implantação prevista,
>   documentação arquitetural atualizada, testado com dado real sem regressão aparente.
> - **Homologação FUNCIONAL — em andamento (RC3.5.4):** os LIMIARES de classificação (tabela
>   abaixo) continuam como linha de base, não confirmados — só migram para "Componentes
>   Homologados"/"Decisões Arquiteturais Consolidadas" ao final da Fase 1, com base em evidência
>   real acumulada, nunca por reação a um resultado inicial baixo.

**Motivação (RC3.5.1):** auditoria encontrou que o IMD atual mede majoritariamente volume/médias
por participante e metas fixas do grupo, não normalizadas pelo nº de participantes — o que permite
a poucos participantes muito ativos elevarem artificialmente o IMD, e penaliza o PG por crescer
(novo participante ainda inativo derruba a média). Confirmado com dado real de produção: um PG com
17% de participantes ativos (1 de 6) rankeava acima de um PG com 100% de participantes ativos (11
de 11).

**Novo princípio arquitetural aprovado:** *"O melhor caminho para aumentar o IMD deve ser envolver
um número cada vez maior de participantes, e nunca concentrar as atividades em poucos membros."*
Nenhuma dimensão pode compensar uma Capilaridade baixa.

**Novos componentes propostos (substituem as 5 dimensões atuais):**
- **Capilaridade Discipular** (peso dominante) — % de participantes elegíveis que são "ativos no
  ciclo". Dimensão que governa a classificação textual do PG (ver limiares abaixo).
- **Engajamento Coletivo** — % de elegíveis que cumpriram o mínimo esperado por frente (oração,
  gratidão/bondade, missão), substituindo as somas do grupo ÷ meta fixa de hoje.
- **Profundidade Discipular** (nome revisado de "Qualidade Discipular" na RC3.5.2, a pedido do
  usuário — evita confusão com o próprio IMD) — mede profundidade/consistência/evolução só entre
  quem já é considerado ativo; peso baixo, de propósito.
- **Missão Coletiva** — mantém Embaixadores (já era % de participantes); revisa campanhas
  administrativas marcadas só pelo Tutor para não contarem como engajamento coletivo.
- **Regularidade** — sucessora quase inalterada da Fidelidade atual (presença/regularidade de
  encontros).

**Elegibilidade (RC3.5.3, implementada):** não removido + registrado há ≥7 dias
(`PG_IMD_CARENCIA_DIAS`) — usa `p.ts` (timestamp de registro em ms, sempre presente) em vez de
parsear `dataInscricao` (string 'DD/MM/AAAA', sem parser no código); registros legados sem data
confiável têm `ts` muito antigo/pequeno, o que já os torna elegíveis na hora — mesmo resultado da
decisão original (`dataInscricao` nulo = elegível imediatamente), sem risco de parsing quebrar.

**"Participante Ativo" → renomeado para "Participante com Evidência de Engajamento" (achado
durante a implementação da RC3.5.3, não um recuo da regra de negócio):** a definição continua
**≥3 dos 7 indicadores** (estudo · oração · bondade · gratidão · missão semanal · streak ·
Embaixadores — missão da Jornada e presença nominal ficaram de fora, ver ressalva abaixo), mas o
**recorte por ciclo teve que ser abandonado** — testado com dado real, nem "semana atual"
(zerava PGs claramente engajados só por virada de semana, pois `contrib.weekKey` não guarda
histórico) nem "qualquer contrib sem limite" (deixaria alguém inativo há meses "ativo" para
sempre) se sustentavam. Solução adotada: usa o ÚLTIMO `contrib` disponível da pessoa (seja qual
for a semana), sem fingir que é um recorte temporal real — daí o nome "Evidência de Engajamento"
em vez de "ativo no ciclo". Correção definitiva depende da **RC3.6** (ver Roadmap, abaixo).

**Limiares de classificação (RC3.5.2A) — gate fixo, a categoria nunca ultrapassa o que Capilaridade
e Regularidade permitem, mesmo com IMD numérico alto:**

| Categoria | Capilaridade mínima | Regularidade mínima |
|---|---|---|
| Altamente Engajado | ≥75% | ≥70% |
| Engajado | ≥60% | ≥50%¹ |
| Engajamento Moderado | ≥40% | ≥30%¹ |
| Baixo Engajamento | >0% | sem exigência |
| Não Engajado | 0% (ou 0 elegíveis) | sem exigência |

¹ Limiares de Regularidade para "Engajado" e "Moderado" foram extrapolados pelo assistente a partir
do par explícito dado pelo usuário só para "Altamente Engajado" (Capilaridade≥75% + Regularidade
≥70%) — **ainda não confirmados com dado real, e não serão ajustados por reação a um resultado
baixo** (decisão explícita do usuário: baixar a régua só porque o resultado ficou baixo é erro
clássico de calibração). Ficam como estão até o fim da Fase 1.

**Fase de Implantação x Consolidação (decisão do usuário, RC3.5.3):** testado com dado real de
produção (23/07/2026), a distribuição ficou **33 de 37 PGs "Não Engajado", 4 "Baixo Engajamento",
0 em Moderado ou acima** — não interpretado como régua rigorosa demais, e sim como reflexo de um
app muito recente (maioria dos PGs criada há 1-2 semanas, muitos participantes ainda dentro da
carência de 7 dias). Função `faseImplantacaoIMDv2()` calcula os dias desde o Marco Zero
(2026-07-05, ver "Estado dos dados na nuvem" no `ESTADO-E-ROADMAP.md`) e exibe no painel: **Fase 1
— Implantação** (dias 0-60, os índices são linha de base, faixas ainda não calibradas) → **Fase 2
— Consolidação** (a partir do dia 60, dado real acumulado suficiente pra calibrar se necessário).
Só então os limiares acima devem ser revisados — com base em distribuição real, não em reação a
um resultado inicial baixo.

**Painel de diagnóstico — distribuição dos indicadores por PG (RC3.5.3, pedido do usuário):**
`calcularDistribuicaoIndicadoresV2(grupoNum)` + `renderDistribuicaoIndicadoresV2(entradas)` —
mostra, por PG, quantos participantes elegíveis (de quantos) cumprem CADA um dos 7 indicadores
individualmente (não só o score agregado). Objetivo: o Tutor enxerga onde reforçar ("ninguém orou
este ciclo") em vez de só "engajamento baixo". Exibido no painel de ranking só quando
`FB_FLAGS.imdV2Diagnostico` está ligada, junto dos cards lado a lado (IMD atual x novo).

**Evolução Discipular — reservado, não implementado nesta RC:** mede a variação (Δ) de indicadores
entre dois pontos no tempo (ex.: início e fim do ciclo) — responde "essa pessoa está crescendo?",
não só "quanto ela tem hoje". Bloqueado por falta de dado: hoje o app só guarda contadores
correntes por participante (`estudosConcluidos`, `xp`, `streak`, `missoesConcluidas`), nunca um
snapshot histórico. Fica reservado o peso zero (`PG_IMD_WEIGHTS.evolucao = 0`, fora do
`totalScore`) e a flag `FB_FLAGS.evolucaoDiscipular` (reservada, sem leitura ainda) — mesmo padrão
já usado no projeto para `useTombstone`/`debounceMs` antes de serem implementadas. Não implementar
até existir infraestrutura de snapshot periódico por participante.

**Compatibilidade confirmada:** nenhuma migração de schema foi necessária — todo dado usado
(`progresso.contrib`, `estudosConcluidos`, `streak`, `embaixadores`, `ts`) já existia por
participante. A ressalva original do `dataInscricao` nulo não bloqueou nada: a RC3.5.3 usa `ts`
(sempre presente) em vez de `dataInscricao`, o que já resolve o caso legado por construção.

**Indicadores fora do escopo da RC3.5.3 (dado não existe hoje):** missão da Jornada
(`missoesConcluidas` é só total vitalício, sem nenhum recorte por tempo) e presença nominal em
encontro (só existe agregado por reunião — presentes/total —, sem o nome de quem esteve lá). Não
bloqueiam a Capilaridade (calculada com os outros 6 indicadores + Embaixadores = 7), mas reduzem a
precisão do modelo até existirem.

### RC3.5.4 — Homologação Operacional (em andamento, sem alteração de algoritmo)

Fase de pura observação durante a Fase 1 de Implantação — **nenhuma mudança de fórmula, peso ou
código de cálculo nesta etapa**, só coleta de evidência real para decidir, ao final da Fase 1, se
os limiares de classificação permanecem ou precisam de ajuste. Perguntas que a Fase 1 deve
responder com dado real (não hipótese):
- Quantos PGs conseguem atingir os 3 indicadores mínimos de Evidência de Engajamento?
- Qual indicador (dos 7) é naturalmente o mais difícil de cumprir?
- Existe algum indicador que quase ninguém registra (candidato a revisão)?
- Existe algum indicador que praticamente todo mundo cumpre (perdeu poder discriminatório)?

**Os 5 indicadores a acompanhar semanalmente durante a Fase 1 (decisão do usuário):**

| Indicador | Objetivo | Implementado em |
|---|---|---|
| Taxa de Conversão | Principal KPI da adoção — % de elegíveis com Evidência de Engajamento | `calcularTaxaConversaoV2` |
| Nº de PGs com Evidência de Engajamento | Expansão da cultura de uso (quantos grupos já têm QUALQUER sinal) | `contarPgsComEvidenciaV2` |
| Média de indicadores por participante | Profundidade do uso (distinto de Capilaridade, que é binário ≥3) | `calcularMediaIndicadoresV2` |
| Distribuição dos 7 indicadores | Identificar práticas negligenciadas ou sem poder discriminatório | `renderDistribuicaoIndicadoresV2` (já existia) |
| Evolução do ranking | Validar a coerência do novo IMD ao longo do tempo | **Não implementado** — exige histórico persistido (ver RC3.6/nota abaixo); hoje só existe a "foto" do momento |

**Linha de base registrada em 2026-07-23:** 38 elegíveis, 6 com Evidência de Engajamento (16% de
conversão), 4 de 37 PGs com pelo menos 1 participante engajado, média de 1,3 de 7 indicadores por
participante elegível. Os 4 primeiros indicadores são só leitura, recalculados ao vivo a cada
abertura do painel — **nenhum persiste histórico semana a semana** (decidir onde/quando gravar um
snapshot é uma decisão maior, deixada em aberto; até lá, o acompanhamento ao longo da Fase 1 é
manual, por leitura periódica do painel). O 5º ("Evolução do ranking") não pode ser respondido sem
essa persistência — é o ponto de partida natural da RC3.6, abaixo.

**Meta operacional da Fase 1 (decisão do usuário — NÃO é critério de homologação, é objetivo de
gestão pastoral para Tutores/Coordenadores agirem em cima):**

| Indicador | Linha de base (23/07/2026) | Meta Fase 1 |
|---|---:|---:|
| Taxa de Conversão | 16% | 40% |
| Média de indicadores por participante | 1,3/7 | 3,0/7 |
| PGs com Evidência de Engajamento | 4/37 | 15/37 |

Atingir (ou não) essa meta não muda os critérios de encerramento abaixo nem os limiares de
classificação — é só a referência que transforma o painel de "medição passiva" em orientação de
ação concreta: a partir de agora, a pergunta de gestão deixa de ser "como melhorar o algoritmo?" e
passa a ser "como aumentar a Taxa de Conversão para Evidência de Engajamento?".

**Critérios objetivos para encerramento da Fase 1 (decisão do usuário — substitui percepção
subjetiva por condição verificável):** a homologação funcional (RC3.5.4) só se conclui quando as
4 condições abaixo ocorrerem **simultaneamente**:
1. Pelo menos 8 semanas de observação desde o Marco Zero (2026-07-05 → a partir de ~2026-08-30).
2. Todos os PGs já fora do período de carência de 7 dias (nenhum participante recém-registrado
   distorcendo a leitura).
3. A distribuição das categorias (Não Engajado/Baixo/Moderado/Engajado/Altamente Engajado)
   estável por, no mínimo, 3 semanas consecutivas.
4. Tutores e Coordenadores confirmarem que o ranking representa adequadamente a realidade dos
   grupos que eles conhecem pessoalmente.
Só então os limiares da tabela acima devem ser revisados — e só se a evidência acumulada pedir
ajuste, nunca por reação a um resultado inicial baixo.

**Regra de mudança durante a Fase 1 (decisão do usuário):** nenhuma alteração de algoritmo,
fórmula ou peso é feita neste período — **exceto correção de defeitos reais** (bugs). Preserva a
estabilidade da base de comparação; qualquer ajuste de calibração vem de comportamento real
acumulado, não de impressão inicial.

### RC3.5.5 — Entrada em Produção do IMD v2 (concluída, só interface — nenhuma fórmula alterada)

Encerra a fase de comparação visual: a homologação técnica (RC3.5.3) foi considerada concluída, e
o IMD v2 passa a ser o **único** índice exibido na interface. Mudança estritamente de
apresentação — nenhuma fórmula, peso, regra de cálculo, limiar ou estrutura de dado foi alterada
(ver "Regra de mudança durante a Fase 1" acima, que continua valendo).

**Removido da interface:** os cards de comparação "IMD atual x IMD novo (v2)" e "Diferença"
(`renderPgRankingCardsV2Diagnostico`, apagado do código — cumpriu sua função só durante a
homologação técnica) e o aviso "🔧 Modo diagnóstico: comparando o modelo atual com o novo modelo".
Nenhuma referência a "v2", "novo", "atual" ou "antigo" sobrevive na tela — onde existia, virou
simplesmente "IMD".

**Preservado na interface (painel de diagnóstico continua exclusivo de Tutor/Coordenador):** aviso
de Fase de Implantação, Taxa de Conversão, PGs com Evidência de Engajamento, Média de Indicadores,
tabela de distribuição dos 7 indicadores, categorias do IMD v2 (Não Engajado/Baixo/Moderado/
Engajado/Altamente Engajado). Nada disso foi removido — só o que comparava as duas versões.

**Motor de classificação novo, exclusivo do v2:** `classificarPgsV2()` +
`compararPgsParaRankingV2()`/`PG_RANKING_TIEBREAK_V2` — antes, o ranking oficial usava o rank/
percentual calculados por `classificarPgs()` (v1) mesmo no modo diagnóstico (só anexava os campos
do v2 para exibir ao lado); agora que só o v2 é mostrado, o rank/percentual/desempate também
precisavam vir do v2 — daí o novo motor, que nunca lê nada do antigo. Mesmo padrão de "PG
formado" e de empate esportivo (1,2,2,4) do motor v1.

**Achado durante o teste (corrigido antes do commit):** `contarPgsComEvidenciaV2` ainda lia o
campo `e.v2Capilaridade` (nome usado só nas entradas do extinto modo diagnóstico) — como
`classificarPgsV2()` usa `capilaridadeScore`, o indicador "PGs com Evidência de Engajamento"
mostrava 0 pra qualquer dado. Corrigido para ler `e.capilaridadeScore`; testado de novo com dado
real, resultado bate com a linha de base já registrada (4 de 37).

**Rollback de contingência:** `FB_FLAGS.imdV2 = false` (renomeada de `imdV2Diagnostico`) faz
`renderRankingPgs` voltar por inteiro ao motor antigo (`classificarPgs`/`renderPgRankingCards`),
sem nenhum elemento do v2 — útil só se a Fase 1 revelar um defeito grave no v2. O motor antigo
(`getPgIMD`, `classificarPgs`, `calcularComunhaoScore` e as demais 4 dimensões v1) permanece
100% intocado no código só para esse cenário; remoção definitiva prevista para o encerramento da
RC3.6.

**Testado:** no preview (servidor estático local + dado real de produção via leitura, sem nenhuma
escrita) — 37 PGs renderizando sem erro de console; confirmado por busca no código que nenhuma
referência a "v2"/"atual"/"antigo"/"diagnóstico" sobrevive na tela de produção; rollback verificado
funcionalmente (motor antigo chamado isoladamente, mesmos resultados de antes). Este app não tem
telas separadas de "Participante"/"Administrativo" para o IMD — só existe dentro do Painel do
Tutor/Coordenador (mesmo controle de acesso de sempre); participante continua sem ver o ranking.

### RC3.6 — Evolução Discipular e Inteligência Temporal (roadmap futuro, não iniciado)

> Renomeado de "RC3.6 — `lastActivityAt`" (decisão do usuário): não é só uma correção técnica
> pontual — é o eixo unificador de tudo que depende do fator TEMPO, hoje ausente do IMD. Reúne sob
> um mesmo guarda-chuva conceitual: `lastActivityAt`, janela móvel de atividade, histórico de
> snapshots, evolução individual, evolução dos PGs, tendências, comparação entre ciclos, e
> crescimento ou estagnação — em vez de tratar cada peça como um item avulso.

Até a RC3.5.3, o IMD mede duas coisas num único instante: **quantos** estão engajados
(Capilaridade) e **como** estão engajados (as demais dimensões) — sempre uma fotografia do momento
atual, nunca uma trajetória. A RC3.6 muda esse eixo: passa a medir **quem evoluiu**, respondendo
perguntas que a RC3.5 estrutural não consegue:
- Quais PGs mais cresceram nos últimos 2 meses?
- Quais líderes (Tutores/Coordenadores) conseguiram aumentar a Taxa de Conversão do próprio grupo?
- Quais grupos estagnaram (mesma Capilaridade/categoria por várias semanas)?
- Quais participantes específicos passaram de baixa para alta Evidência de Engajamento?

**Pré-requisito técnico (achado na RC3.5.3):** sem um carimbo de última atividade, não existe hoje
forma de calcular nem uma janela móvel real (ex.: "ativo nos últimos 30 dias") nem uma trajetória
ao longo do tempo — as duas dependem da mesma peça de infraestrutura que falta: **histórico**, não
só estado atual. Proposta: novo campo `p.progresso.lastActivityAt` (timestamp em ms, atualizado
pelos mesmos gatilhos de `bumpPgProgress`/conclusão de estudo/missão/streak) resolve a janela móvel
por participante; um snapshot periódico persistido (por PG e/ou por participante) resolve a
trajetória agregada ("Evolução do ranking", 5º indicador da RC3.5.4). Aditivo, não quebra nada
existente. Só inicia depois que a Fase 1 terminar e os critérios de encerramento acima forem
atendidos — a RC3.5.4 é, na prática, a coleta de evidência que vai dizer se essa infraestrutura
longitudinal é o próximo passo certo.

**Nota (RC4.8.2A, 2026-07-27):** a mesma lacuna de infraestrutura temporal identificada aqui para o
IMD reapareceu, de forma independente, na modelagem de Cobertura Setorial (ver ADR-001) — reforça
que o problema é estrutural, não específico de um indicador. Quando a infraestrutura longitudinal
desta RC3.6 for construída, ela deve atender IMD, Cobertura Setorial, ADV-E e demais indicadores
institucionais ao mesmo tempo, em vez de um mecanismo de histórico por RC.

### RC4.8 — Cobertura Setorial Institucional / ADV-E (em andamento)

> Sequência homologada: RC4.8.1 (auditoria arquitetural, sem código) → RC4.8.2 (cadastro dos
> setores do PG) → RC4.8.2A (Cadastro Mestre + Efetivo Institucional, ver ADR-001) → RC4.8.3A
> (motor de cálculo, concluído) → RC4.8.5A (Participação Institucional no Embaixadores +
> invariante `participanteContaParaSetor`, ver ADR-002, **homologada**) → RC4.8.3B (Painel
> Operacional do Coordenador do PG — Cobertura Setorial + Embaixadores, redefinida, em
> andamento) → RC4.8.4 (Painel ADV-E, planejada) → RC4.9 (Motor
> Institucional de Relatórios, **deliberadamente postergada** — ver abaixo).

- **RC4.8.1 — Diagnóstico arquitetural (concluído).** Auditoria de como modelar Cobertura
  Setorial sem repetir o defeito de comparação por nome já corrigido na RC-REST-02.
- **RC4.8.2 — Cadastro dos Setores do PG (concluído).** Bloco "Cobertura Setorial" no Painel
  do Tutor/Coordenador: adicionar/editar/excluir/reordenar, só cadastro, sem cálculo.
- **RC4.8.2A — Cadastro Mestre de Setores + Efetivo Institucional (homologada).**
  Ver "Cobertura Setorial Institucional" nos Componentes Homologados e ADR-001, acima.
- **RC4.8.3A — Motor de Cobertura Setorial (concluído).** Só cálculo: leitura do Efetivo
  Institucional, contagem automática de participantes por setor, percentual, classificação
  🟢/🟡/🔴 — `calcularCoberturaSetorial()`.
- **RC4.8.5A — Participação Institucional no Embaixadores da Esperança (homologada).** Painel
  cross-PG por setor (participantes do PG + externos informados manualmente), ver
  "Participação Institucional no Embaixadores da Esperança" acima e ADR-002. Estabeleceu o
  invariante `participanteContaParaSetor()` — usado agora por Cobertura Setorial e
  Embaixadores, obrigatório para qualquer indicador futuro que cruze participante e setor —
  e duas proteções de consistência: confirmação ao atribuir setor fora dos acompanhados pelo
  PG, e bloqueio ao tentar remover um setor acompanhado com participantes ainda vinculados.
- **RC4.8.3B — Painel de Indicadores por Setor (redefinida duas vezes, em andamento).**
  Objetivo ampliado de "só Interface de Cobertura" (1ª redefinição: reunir Cobertura Setorial
  + Embaixadores como blocos irmãos dentro de `renderTutorGrupoDetalhe`; 2ª redefinição,
  2026-07-27: fundir os dois num único "📈 Indicadores por Setor" — um cartão por setor,
  mostrando Pequenos Grupos e Embaixadores juntos, cada um com barra de progresso). Ainda em
  aberto: resumo consolidado do PG e mensagens de meta atingida. Segue a **diretriz de
  relatório** abaixo (decisão da RC4.9, aplicada retroativamente a este relatório).
  **Oportunidade futura registrada (ainda não implementada):** uma vez que o modelo
  estabilizar, extrair uma estrutura única `IndicadorSetorial` (setorId, totalColaboradores,
  matriculadosPG, percentualPG, statusPG, participantesEmbaixadores, percentualEmbaixadores,
  statusEmbaixadores) que alimente Painel do PG, Painel ADV-E e os futuros renderizadores da
  RC4.9 (impressão, WhatsApp, PDF) a partir da mesma fonte — coerente com a decisão já
  registrada de separar modelo de dados de apresentação. Não antecipada nesta RC pelo mesmo
  motivo da RC4.9: só vale a pena generalizar depois de existir mais de um consumidor real
  (hoje só o Painel do PG existe; o Painel ADV-E, RC4.8.4, é o segundo candidato natural).
- **RC4.8.4 — Painel ADV-E (planejada).** Dashboard institucional cross-PG: por setor (nome,
  total, matriculados, cobertura, meta, status) + indicadores gerais (total de setores,
  setores acima/abaixo da meta, cobertura institucional) + gráficos. Inclui também o
  detalhamento por PG dentro de cada setor do Embaixadores (ex.: "PG Manancial / PG
  Esperança / PG Vida"), deliberadamente deixado fora da RC4.8.3B por ser consolidação, não
  operação (ver "toda consolidação nasce no Painel ADV-E"). Consome
  `SETORES_MESTRE`/`SETORES_EFETIVO` diretamente (fonte única), sem agregação por nome.
  Também segue a diretriz de relatório abaixo.

**Diretriz de relatório (decisão da RC4.9, 2026-07-27 — vale desde já para RC4.8.3B e
RC4.8.4, mesmo antes do motor genérico existir):** todo relatório novo separa **modelo de
dados** (um objeto próprio do relatório — título, subtítulo, data/hora, tabelas, indicadores,
rodapé — no espírito de um futuro `ReportModel`, mesmo que ainda não seja o objeto
compartilhado da RC4.9) de **apresentação** (tela, impressão, resumo para WhatsApp, resumo
para e-mail). Objetivo: quando a RC4.9 for iniciada, grande parte da estrutura já vai estar
organizada dessa forma, em vez de precisar ser desmontada de uma implementação monolítica.

**Checklist de implantação desta RC (antes de produção):** adicionar `setoresMestre`,
`setoresEfetivo` e `embaixadoresExternos` na allowlist da regra do Firestore
(`hasOnly([...])`) — ver ADR-001 e ADR-002, "Limitações conhecidas".

### RC4.9 — Motor Institucional de Relatórios (deliberadamente postergada)

**Decisão arquitetural (2026-07-27):** extrair o Motor Institucional de Relatórios (modelo
de dados único — `ReportModel` — e renderizadores compartilhados para tela, impressão,
WhatsApp e e-mail) **somente depois que existirem pelo menos dois relatórios concretos
implementados** (Cobertura Setorial — RC4.8.3B — e Painel ADV-E — RC4.8.4), evitando
abstração prematura e permitindo que o modelo seja derivado da experiência prática do
sistema, não desenhado no vazio. Mesma disciplina já aplicada em outras decisões deste
projeto (ex.: RC3.6 não antecipar solução parcial de histórico).

**Escopo já decidido, para quando a RC4.9 iniciar** (evita retrabalho de decisão, só de
implementação):
- **Impressão:** obrigatória, via recursos nativos do navegador (`window.print()` + CSS
  `@media print`). Nenhuma dependência externa.
- **PDF:** sem biblioteca. Primeira versão usa o fluxo nativo do navegador ("Imprimir →
  Salvar como PDF") — zero dependência nova, sem aumento do tamanho do app. Biblioteca de
  PDF só entra em avaliação futura, se surgir requisito real que a justifique.
- **WhatsApp — Fase 1 (nesta arquitetura):** resumo textual institucional gerado
  automaticamente a partir do `ReportModel`, compartilhado pelo mecanismo `wa.me` já
  existente no app (mesmo usado em convites/lembretes). Não anexa arquivo.
- **WhatsApp — Fase 2 (futura):** envio de documento, condicionado a existir infraestrutura
  de geração de arquivo (ver decisão de PDF acima).
- **E-mail:** sem backend, não existe envio real. Limite desta fase: abrir o cliente de
  e-mail via `mailto:` com assunto/corpo preenchidos automaticamente. Nenhum anexo esperado.

---

## Decisões Arquiteturais Consolidadas

Somente decisões já homologadas:

- O PG nunca usa a soma do XP dos participantes — sempre média, para não favorecer grupo maior.
- `pgIMD` (mede discipulado) e `pgRanking` (mede posição relativa) são objetos separados; um
  não sabe calcular o outro.
- Toda dimensão do IMD usa só dado real já sincronizado no app; onde falta dado (Diário
  Espiritual por participante, leitura bíblica, histórico de mural além de 7 dias), o ponto
  fica marcado como extensão futura em vez de inventar um número.
- Nenhum peso (entre dimensões ou dentro de uma dimensão) fica solto no meio do código — todos
  vivem em constantes nomeadas (`PG_IMD_WEIGHTS`, `PG_IMD_SUBWEIGHTS`, `MAX_STREAK_DAYS`).
- Critério de desempate é fixo e documentado; empate real nunca vira sorteio.
- PG sem nome definido é identificado como `"${PG_DEFAULT_NAME} N"` (nunca excluído do ranking);
  assim que o grupo recebe um nome, a próxima classificação já mostra o nome novo (o nome é
  sempre consultado dinamicamente, nunca congelado no cálculo).
- Painéis analíticos (ranking) são somente leitura — a gravação (`atualizarPgIMD`/
  `atualizarPgRanking`) é responsabilidade de um evento de mudança de dado, nunca da abertura
  de uma tela.
- Ranking disponível exclusivamente para Tutor/Coordenador, nunca para participante.

---

## Invariantes Arquiteturais

Regras que não devem ser quebradas, salvo decisão explícita de arquitetura registrada neste
documento:

1. Nenhuma funcionalidade é implementada sem passar pelo fluxo de governança.
2. O cálculo do IMD é independente da interface.
3. A interface nunca recalcula indicadores — só consome o resultado do motor.
4. Painéis analíticos são somente leitura.
5. O ranking consome exclusivamente o motor de classificação (`classificarPgs()`).
6. O XP individual nunca é alterado pelo ranking do PG.
7. O ranking utiliza médias e percentuais, nunca a soma simples do XP dos participantes.
8. Inteligência Pastoral (Épico 4) e Gamificação (Épico 5) permanecem em épicos distintos.
9. Toda RC homologada que alterar a arquitetura deve atualizar este `ARCHITECTURE.md` antes do
   commit final:
   ```
   Implementação → Homologação → Atualização do ARCHITECTURE.md → Commit → Tag (quando aplicável)
   ```

---

## Histórico

### RC3.1 — Infraestrutura do IMD (`averageMemberXP`)
- **Data:** 2026-07-16
- **Commit:** `9322c76`
- **Status:** Homologado

### RC3.2 + RC3.2.1 — Cálculo das 5 dimensões, pesos configuráveis, `pgIMD`
- **Data:** 2026-07-16
- **Commit:** `5db071b`
- **Status:** Homologado

### RC3.3 — Motor de classificação (`classificarPgs`, desempate, `pgRanking`)
- **Data:** 2026-07-16
- **Commit:** `b2eee6a`
- **Status:** Homologado

### RC3.3 (ajustes) + RC3.4A + RC3.4A.1 — Painel do Tutor somente leitura, separação definitiva entre leitura e escrita
- **Data:** 2026-07-16
- **Commit:** `e95db2a`
- **Tag:** `v3.4a.1-homologado`
- **Status:** Homologado

---

## Estado da Arquitetura

🟢 **Estável**

**Current Baseline:** `v3.4a.1-homologado`

> A partir desta versão, este documento passa a ser um **documento protegido**: só é alterado
> quando uma nova RC for homologada — nunca para registrar planejamento ou proposta em aberto.
