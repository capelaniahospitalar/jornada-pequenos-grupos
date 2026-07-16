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
