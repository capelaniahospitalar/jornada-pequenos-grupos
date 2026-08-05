# ADR-005 — Ciclo de Vida dos Pequenos Grupos

**Data:** 2026-08-05 · **Status:** Aceito (decisão conceitual aprovada em 2026-08-05 — ainda não
implementado, não homologado; implementação inicial planejada em RC6.0.1A)

> **Nota de numeração:** foi sugerido nomear este documento "ADR-008". A série de ADR avulsos
> deste repositório, porém, vai até `ADR-004` — `ADR-001` e `ADR-002` já estão embutidos no
> `ARCHITECTURE.md` (homologados: Separação de Setores/RC4.8.2A e regra de contagem por setor
> acompanhado/RC4.8.5A); `ADR-003` (Identidade Canônica da Pessoa) e `ADR-004` (Migração
> Progressiva de Persistência) são os avulsos pendentes, ainda não implementados. Por essa mesma
> regra de numeração (registrada em `ADR-003`), este é o próximo da fila avulsa: **ADR-005**, não
> um "ADR-008" novo. Mesma regra de convivência do `ADR-003`/`ADR-004`: este documento **vive como
> arquivo avulso até a implementação ser homologada** — só então migra para dentro do
> `ARCHITECTURE.md`.

---

## Problema

A série de auditorias RC6.0.X (leitura, memória, listeners, renderização, comparação de pares e
governança da criação — todas somente leitura, sem alteração de código) chegou a uma causa raiz
comum: o modelo de dados de Pequeno Grupo **implementa só a metade "criação" de uma máquina de
estados, sem metade de "encerramento"**.

Hoje, o "estado" de um PG não é um campo — é **inferido** pela combinação de três campos
(`getGrupoStatus`, `index.html:9444-9451`):

```
vazio     → nome, tutor E coordenador todos nulos
formação  → tem nome OU tutor OU coordenador, mas falta pelo menos um
completo  → nome + tutor + coordenador, todos preenchidos
```

Essa inferência tem duas falhas, confirmadas em código e em dado real de produção:

1. **`formação` é um beco sem saída.** O mecanismo que decide onde um PG novo pode nascer
   (`getProximoGrupoVazio`, `index.html:9453-9457`) só reconhece como disponível um slot com
   status `vazio` — os três campos nulos ao mesmo tempo. Assim que um Tutor preenche nome (mesmo
   sem coordenador confirmado), o slot sai de `vazio` e nunca mais volta a ser candidato a reuso,
   mesmo que o convite do Coordenador nunca seja aceito. Não existe, em lugar nenhum do código,
   uma função para excluir, esvaziar ou arquivar um PG — a única forma de um slot voltar a
   `vazio` hoje é edição manual direta no Firestore, por fora do app.
2. **Não há verificação de nome duplicado na criação.** `confirmarCriarPg`
   (`index.html:3176-3197`) só valida nome-não-vazio e existência de slot livre — nunca compara
   o nome digitado com os 49 outros grupos.

**Evidência em produção (auditoria de 2026-08-05):** 11 dos 50 slots têm nome preenchido, zero
participantes ativos, zero mural, zero histórico e zero atividade registrada — presos no estado
`formação` para sempre. Quatro deles formam dois pares de nome idêntico com um PG realmente ativo
(PG 38/"Foco no Alto" × PG 2; PG 32/"Manutenção da Fé" × PG 5) ou entre si (PG 7 × PG 13,
"Plantão B Hotelaria"; PG 41 × PG 45, "FORTALEZA"/"Fortaleza"). O par PG 41×45 é particularmente
revelador: o PG 45 **não existia** no início da sessão de auditoria (13:40 UTC) e já existia,
colidindo de nome com o PG 41, no fim da mesma sessão (19:14 UTC) — prova de que o problema
continua ativo, não é só estoque histórico a limpar.

## Contexto herdado (não pode ser ignorado nesta decisão)

- **`ARQ-002` (Modelo Conceitual do Domínio)** já declara `num` como identificador canônico do
  PG, descrito textualmente como "**não reaproveitável**... nunca reciclado"
  (`ARQ-002-MODELO-CONCEITUAL-DOMINIO.md`, seção 5). Isso tem implicação direta sobre qualquer
  proposta de "liberar um slot para reuso" — tratada na seção Decisão, abaixo.
- **Não existe UUID nem código de PG** — só `num` (confirmado nas auditorias RC6.0.X anteriores).
  Qualquer campo de estado novo se ancora só nele.
- **`ARQ-006` (Observabilidade, Auditoria, Histórico)** já prevê que "cada mudança de estado
  relevante" das entidades do domínio deve ser auditável. Este ADR deve alimentar aquele modelo,
  não criar um paralelo.
- **`ARQ-007`** encerrou formalmente a série de análise arquitetural (ARQ-001 a ARQ-007) — "qualquer
  próximo passo é implementação, não [mais diagnóstico]". Este documento nasce, portanto, como
  `ADR` (decisão pontual), não como um novo `ARQ` da série concluída.

## Alternativas consideradas

1. **Manter a inferência por combinação de campos, só ajustando os filtros das telas** (ex.:
   Ranking passa a exigir `participantesAtivos > 0`) — descartada como solução completa: resolve o
   sintoma na tela, mas não impede que o próximo PG 45 aconteça, nem dá um caminho para excluir/
   arquivar um PG que existiu de verdade. É a "Causa raiz 2" isolada, sem tocar a 1 e a 3.
2. **Campo `status` explícito, 4 valores (`EM_FORMACAO` / `ATIVO` / `INATIVO` / `ARQUIVADO`), com
   `LIVRE` como quinto valor reservado ao slot nunca reivindicado — adotada**, com uma reserva
   importante sobre a transição de volta a `LIVRE` (ver Decisão).
3. **Campo `status` simplificado, 3 valores (`FORMACAO` / `ATIVO` / `ENCERRADO`)** — descartada por
   ora: colapsa `INATIVO` e `ARQUIVADO`, que têm reversibilidade diferente (`INATIVO` deveria
   poder reativar sem fricção; `ARQUIVADO` é, deliberadamente, de difícil retorno). Manter os 4
   valores não tem custo adicional relevante e preserva essa distinção.

## Decisão

Adotar a alternativa 2: um campo `status` explícito no Pequeno Grupo, com 5 valores possíveis, a
matriz de transições abaixo, e os ajustes de tela/relatório correspondentes.

### Estados

| Estado | Significado | Entra em Ranking/estatísticas? | Aparece em "Meus Grupos"? | Visível a participantes? |
|---|---|---|---|---|
| `LIVRE` | slot nunca reivindicado (equivalente ao `'vazio'` de hoje) | Não | Não | Não |
| `EM_FORMACAO` | Tutor definiu nome/dia/hora; aguardando Coordenador confirmar | Não | Sim, só ao Tutor que criou | Não |
| `ATIVO` | Coordenador confirmado, grupo operando | Sim | Sim | Sim |
| `INATIVO` | Grupo encerrou atividade por ora; pode reabrir | Não | Sim, com selo "inativo" | Não |
| `ARQUIVADO` | Encerramento definitivo — só consulta histórica | Não | Não (só em consulta de histórico, tela própria) | Não |

### Transições permitidas e autoridade

| De | Para | Quem executa | Gatilho |
|---|---|---|---|
| `LIVRE` | `EM_FORMACAO` | Tutor autorizado (allowlist institucional ou já-tutor de outro PG) | Confirma o formulário "Novo Pequeno Grupo" |
| `EM_FORMACAO` | `ATIVO` | Sistema, automático | Coordenador aceita o convite de uso único |
| `EM_FORMACAO` | `LIVRE` | Tutor que criou (cancelamento explícito) OU sistema (expiração automática) | Cancela, ou o convite de Coordenador expira sem uso e ninguém confirma dentro de um prazo definido |
| `ATIVO` | `INATIVO` | Tutor ou Coordenador do próprio PG | Ação explícita "Encerrar temporariamente" |
| `INATIVO` | `ATIVO` | Tutor ou Coordenador do próprio PG | Ação explícita "Reativar" |
| `ATIVO` ou `INATIVO` | `ARQUIVADO` | Só papel institucional (Administrador/allowlist de Tutores) — não o Tutor comum do PG | Ação explícita, com confirmação — não reversível pela própria pessoa |
| `ARQUIVADO` | `LIVRE` | **Nunca automático, e restrito — ver reserva abaixo** | — |

### Princípio: Imutabilidade da identidade canônica

> Acrescentado na revisão de 2026-08-05, a pedido explícito do usuário, para transformar a
> reserva técnica abaixo em regra normativa do domínio, não só numa recomendação de projeto.

O campo `num` identifica permanentemente um Pequeno Grupo a partir do momento em que esse PG
atinge o estado `ATIVO` pela primeira vez. A partir desse instante, o número torna-se histórico:
não pode ser reatribuído a outro grupo, mesmo depois de `ARQUIVADO`. Esta regra tem prioridade
sobre qualquer conveniência de aproveitamento de slot — nenhuma implementação futura deste modelo
pode violá-la sem abrir um novo ADR que reavalie explicitamente esta decisão.

### Reserva sobre "ARQUIVADO → reutilizado"

A proposta original incluía uma transição `ARQUIVADO → LIVRE` (reaproveitamento de slot). Este
ADR **recomenda não implementá-la para nenhum PG que já passou por `ATIVO`**, por conflitar
diretamente com a decisão já registrada em `ARQ-002`: `num` é a identidade canônica do PG,
descrita ali como não-reaproveitável. Há um motivo concreto para essa restrição, não só
formalidade: convites (mesmo expirados), posts do mural, relatórios mensais já gerados e o
histórico do Ranking IMD referenciam um PG pelo `num`. Se o `num` 12 for hoje "Deus é minha
fortaleza — Portaria 1" e amanhã virar um PG completamente diferente por reaproveitamento,
qualquer registro histórico antigo passa a apontar, silenciosamente, para uma identidade errada —
recriando, ao contrário, o mesmo problema de integridade que este ADR existe para resolver.

A liberação `→ LIVRE` deve valer **só para `EM_FORMACAO` que nunca chegou a `ATIVO`** — exatamente
o perfil dos 11 slots residuais já encontrados (nenhum teve Coordenador confirmado nem
participante real). Um PG que já foi `ATIVO` e depois `ARQUIVADO` mantém seu `num` para sempre —
ele teve vida real; apagar essa identidade seria o próprio "cadastro fantasma às avessas". Se a
Capelania precisar de mais de 50 PGs simultâneos no futuro, a resposta correta é estender o
array (decisão técnica separada, fora do escopo deste documento) — nunca reciclar a identidade de
um grupo que existiu.

### Telas e relatórios afetados

| Tela / função | Filtro hoje (mapeado nas auditorias RC6.0.X) | Filtro proposto |
|---|---|---|
| Ranking IMD — `classificarPgs()`/`classificarPgsV2()` | `g.nome \|\| participantesAtivos(g).length`, excluindo só nome com "teste qa" | `g.status === 'ATIVO'` |
| "Meus Grupos" — `getGruposDoResponsavel()` | por correspondência de nome a tutor/coordenador, sem olhar estado | mantém o filtro por pessoa; passa a agrupar visualmente por `status` (selo "em formação" / "inativo") |
| Painel Institucional — `calcularEmbaixadoresPorSetor()` | soma participantes de todos os PGs que declaram o setor | soma só PGs com `status === 'ATIVO'` |
| Criação de PG — `getProximoGrupoVazio()` | `nome`, `tutor` e `coordenador` todos nulos | `status === 'LIVRE'` |
| Tela de detalhe do PG (qualquer uma) | não distingue estado | sempre exibe o selo de `status` |

### Preservação de histórico sem "cadastros fantasmas"

Nenhuma transição apaga dado. `INATIVO` e `ARQUIVADO` preservam `participantes`, `gratidoes`,
`reunioesMes`, `campanhas` e os indicadores já calculados intactos — só saem das consultas ativas
(Ranking, estatísticas, listagens visíveis a novos membros). É o mesmo princípio de poda por
visibilidade já em uso no projeto para participante removido (`podarParticipantesRemovidos`,
tombstone de 30 dias) e gratidão expirada (`podarGratidoesExpiradas`, 7 dias) — nunca exclusão
física do dado.

## Consequências positivas

- Resolve as três causas raiz da auditoria RC6.0.X (dado residual, regra de negócio do Ranking,
  apresentação sem distinção visual) com uma única fonte de verdade (`status`), em vez de três
  correções pontuais e independentes que poderiam voltar a divergir.
- Compatível com `ARQ-006`: cada transição de `status` é, por definição, o tipo de "mudança de
  estado relevante" que aquele documento já previa auditar.
- Não conflita com `ARQ-002` — preserva `num` como identidade estável e não-reaproveitável para
  qualquer PG que teve vida real (`ATIVO` em algum momento).
- Fecha, pela primeira vez, o lado "encerramento" do ciclo de vida — hoje inexistente no produto.

## Limitações conhecidas

- Migração dos 50 slots existentes (atribuir um `status` inicial coerente a cada um, incluindo os
  11 residuais e os 39 restantes) exige decisão caso a caso — não é automática, e não é o escopo
  deste documento. O relatório de Higienização já entregue é o insumo para essa decisão, não uma
  execução dela.
- Não resolve, por si, o limite de 50 slots — se a Capelania precisar de mais PGs simultâneos que
  nunca se `ARQUIVAM` de volta a `LIVRE`, o array de 50 posições se esgota mais rápido do que
  esgotaria com reaproveitamento total. Decisão sobre estender a capacidade fica para um ADR
  separado, se e quando o limite for de fato alcançado.
- Nenhum código foi alterado por este documento — é registro de decisão, não implementação. Segue
  o mesmo padrão de migração progressiva já formalizado em `ADR-004`: qualquer implementação
  futura deste modelo deve coexistir com a inferência atual atrás de uma feature flag, com
  validação contra dado real antes do corte final — não uma substituição "big bang" do campo
  `status` por cima dos 50 registros de produção.
