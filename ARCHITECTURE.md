# Jornada Discipular em Pequenos Grupos

## Arquitetura Oficial

| | |
|---|---|
| **Versão arquitetural** | `v3.4a.1-homologado` |
| **Última atualização** | 2026-07-16 |

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

### Persistência

Campos por grupo (`PEQUENOS_GRUPOS[n]`), sincronizados como qualquer outro dado do grupo:

| Campo | Preenchido por | Observação |
|---|---|---|
| `pgIMD` | `atualizarPgIMD()` | Ainda não é chamada por nenhum evento automático — existe pronta. |
| `pgRanking` | `atualizarPgRanking()` | Idem — ainda não é chamada por nenhum evento automático. |
| `pgRanking.schemaVersion` / `pgIMD.schemaVersion` | idem | Versão do formato do objeto, para migração futura. |
| `pgRanking.displayName` | `atualizarPgRanking()` | Instantâneo do nome do grupo no momento do cálculo (não uma referência viva) — preserva "como o grupo se chamava naquela data" para histórico/relatórios futuros. |

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

### RC3.5 — Redesenho do IMD por Capilaridade Discipular (RC3.5.3 HOMOLOGADA TECNICAMENTE — RC3.5.4 HOMOLOGAÇÃO FUNCIONAL em andamento)

> RC3.5.1 (auditoria) → RC3.5.2 (proposta) → RC3.5.2A (decisões finais) → RC3.5.3 (implementação,
> `index.html`, motor `getPgIMDv2`/`classificarPgsV2Diagnostico`, convive com o motor antigo
> intocado via `FB_FLAGS.imdV2Diagnostico`) → RC3.5.4 (homologação operacional, em andamento).
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
