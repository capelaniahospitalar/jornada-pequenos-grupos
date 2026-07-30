# PLANO-IMPLEMENTACAO-FASE-1 — Estratégia de Execução da Evolução Arquitetural

> Realizado em 2026-07-30, sobre o `MARCO-001` e a série `ARQ-001` a `ARQ-007`. **Não escreve
> código.** Traduz o diagnóstico em ordem de execução — é o último documento antes de a
> implementação começar de fato.

---

## 0. Reconciliação de numeração (para não confundir com documentos anteriores)

O `ARQ-007 §12` já propôs um roadmap mestre em 4 fases (Fundação → Migração → Segurança/
Auditoria → Novas funcionalidades). Este documento **refina** essa proposta com um nível de
detalhe maior, adotando a subdivisão sugerida agora: uma fase de infraestrutura pura **antes**
de tocar em identidade. A partir daqui, esta é a numeração oficial de fases de implementação —
o `ARQ-007 §12` fica registrado como a visão de mais alto nível, este documento como o
detalhamento executável:

```
Fase 1 — Fundação de Segurança     (infraestrutura, zero mudança visível, zero dado de domínio novo)
Fase 2 — Nova Identidade           (Pessoa/personId/authUid — coexistência, sem cutover de leitura)
Fase 3 — Nova Persistência         (= ARQ-004.1 completo, entidade por entidade)
Fase 4 — Recuperação e Auditoria   (snapshots automatizados + Event Log, ARQ-006)
```

## 1. Uma correção técnica antes de detalhar a Fase 1

A proposta original menciona "criação das novas coleções vazias" como parte da Fase 1. Vale
registrar uma imprecisão pequena, mas que evita expectativa errada: **o Firestore não tem uma
operação de "criar coleção vazia"** — uma coleção só passa a existir quando o primeiro documento
é gravado nela. O equivalente real e igualmente seguro, dentro do espírito pedido (preparar o
terreno sem tocar em dado de domínio ainda), é: **um documento de teste técnico** (ex.:
`/pessoas/_smoke_test`), escrito e depois removido, só para confirmar que o caminho novo aceita
escrita/leitura sob a configuração atual — não é "a coleção pronta esperando", é uma checagem de
viabilidade antes de qualquer dado real entrar.

---

## 2. Fase 1 — Fundação de Segurança

**Objetivo:** construir o andaime que torna toda fase seguinte reversível e auditável, sem
alterar nenhuma tela nem migrar nenhum dado de domínio ainda.

**Conteúdo:**
- Convenção de `schemaVersion` formalizada — todo registro novo (a partir da Fase 2) nasce com
  `schemaVersion: 1`; nenhuma migração depende de "eu sei que já rodei isso antes" por memória
  humana ou variável solta — sempre verificável pelo próprio dado (mesmo padrão já usado em
  `migrarSetoresParaMestre`, que checa a forma do dado, não uma flag "já migrei").
- Runner de migração idempotente generalizado — a mesma função pode ser chamada qualquer número
  de vezes sem duplicar nem corromper nada (precondição: sempre checar o estado atual antes de
  agir, nunca assumir).
- Log técnico mínimo da própria migração (distinto do Event Log de negócio da Fase 4) — quando
  uma função de migração rodou, com que resultado.
- `FB_FLAGS` novas criadas, **todas desligadas por padrão** — `pessoaModelo`,
  `participacaoModelo`, `setorColecao`, `pgColecao`, `auditoriaEventos` (nomes ilustrativos, a
  confirmar na implementação). Nenhuma muda comportamento até ser ligada.
- Checagem de viabilidade dos caminhos novos (seção 1, acima).
- **Em paralelo, não bloqueante:** oficializar o botão de exportação manual (`ARQ-005 §1`) —
  pode entrar em produção já, sem depender de nenhuma outra fase.
- **Em paralelo, ação humana, não código:** segundo administrador Firebase (`ARQ-005.1`).

**Critérios de entrada:** `MARCO-001` registrado (✅ já cumprido); `BACKUP-PRE-ARQ-001`
existente (✅ já cumprido).

**Critérios de saída:** convenção de `schemaVersion` documentada no `ARCHITECTURE.md`; runner de
migração testado com um caso de baixo risco (candidato natural: reaproveitar o próprio padrão já
existente do Setor, não precisa ser sobre Pessoa ainda); todas as flags novas confirmadas
desligadas em produção; nenhuma tela do app mudou de comportamento.

**Riscos:** praticamente nenhum — esta fase, por desenho, não tem poder de causar dano, porque
nenhuma flag está ligada e nenhum dado de domínio é tocado.

**Rollback:** trivial — remover as funções/flags novas não afeta nada em produção, porque nada
as usa ainda.

---

## 3. Fase 2 — Nova Identidade

**Objetivo:** `Pessoa`/`personId` passam a existir e ser populados a partir do dado atual;
`authUid` (Firebase Auth anônimo) é vinculado a cada `Pessoa`. **O app continua lendo e
escrevendo pelo caminho antigo (`memberId`/nome)** — pura coexistência, sem cutover de leitura.

**Critérios de entrada:** Fase 1 concluída e homologada.

**Critérios de saída:** painel de diagnóstico comparativo (mesmo padrão do `ARQ-004.1 §2`)
mostrando correspondência completa entre pessoas inferidas do modelo atual e registros `Pessoa`
criados; pelo menos um ciclo real de autenticação anônima testado sem quebrar nenhum fluxo
visível; os "órfãos" já identificados (tutor sem `memberId`, caso confirmado em código no
`ARQ-002.1 §0`) reconciliados manualmente ou marcados explicitamente como pendentes.

**Riscos:** reconciliação de órfãos não é 100% automatizável (mesmo risco de colisão de nome já
documentado, RC-REST-02) — exige revisão humana pontual, não é motivo para adiar a fase, é
motivo para não prometer automação total dela.

**Rollback:** flag desliga a criação de `Pessoa` nova; como a leitura ainda é 100% do modelo
antigo, nenhum usuário percebe a diferença se a fase for revertida.

---

## 4. Fase 3 — Nova Persistência

**Objetivo:** aplicação integral do plano já detalhado no `ARQ-004.1` — escrita dupla → leitura
migrada → escrita migrada → corte do documento único — agora entidade por entidade.

**Dados que podem ser migrados primeiro:** duas respostas, porque a pergunta "primeiro" cabe em
dois critérios diferentes, não conflitantes:
- **Por menor risco (ensaio geral do mecanismo):** `Setor` — já isolado conceitualmente desde o
  ADR-001, não depende de `Pessoa` para existir, menor volume. Serve como o primeiro teste real
  de ponta a ponta do mecanismo de coexistência com dado de produção, antes de arriscar algo que
  todo o resto depende.
- **Por ordem de dependência (o que desbloqueia o restante):** `Pessoa` → `Participação` → `PG`
  — nesta ordem, porque cada uma referencia a anterior (`ARQ-004.1 §2.4`).

**O que NÃO deve ser alterado junto (fronteira explícita desta fase):**
- Nenhuma tela muda de aparência — é fundação por baixo, não funcionalidade nova.
- Nenhuma fórmula de cálculo muda (IMD, Ranking, Cobertura Setorial, Embaixadores permanecem
  exatamente como estão — mudam só de onde leem o dado, nunca como calculam).
- Nada do Épico 4 (Inteligência Pastoral) ou Épico 5 (Gamificação) entra nesta fase — fora de
  escopo, mesmo com a tentação de "já que estamos mexendo".
- As regras de negócio já homologadas (ex.: `participanteContaParaSetor`, tombstone de 30 dias)
  não são revisadas nesta fase — só re-hospedadas na nova estrutura de dado.

**Critérios de entrada:** Fase 2 concluída, painel de diagnóstico sem divergência pendente.

**Critérios de saída:** os mesmos já definidos no `ARQ-004.1 §3` — 60 dias de escrita dupla sem
divergência, mais um ciclo real de recuperação de identidade observado com sucesso.

**Riscos e rollback:** integralmente os já descritos no `ARQ-004.1`, seções "Riscos" e pergunta
5 ("como fazer rollback") — não repetidos aqui.

---

## 5. Fase 4 — Recuperação e Auditoria

**Objetivo:** snapshots automatizados (evolução do backup manual da Fase 1) + Event Log de
domínio (`ARQ-006`) entram em operação — **só agora**, porque a escrita já está centralizada por
entidade desde a Fase 3, evitando repetir a "assimetria escrita↔leitura" já vista 3 vezes no
projeto (`ARQ-006 §11`).

**Critérios de entrada:** Fase 3 com escrita 100% no modelo novo (documento único já desligado
para a entidade em questão).

**Critérios de saída:** todo evento obrigatório do catálogo (`ARQ-006 §3`) sendo gerado
corretamente, validado com um incidente simulado (ex.: remover um participante de teste e
confirmar que o evento correspondente aparece com os dados corretos).

---

## 6. Consolidado dos 10 pontos pedidos

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Ordem das fases | Fase 1 → 2 → 3 → 4 (seção 0) |
| 2 | Objetivo de cada fase | Seções 2-5 |
| 3 | Critérios de entrada | Seções 2-5, campo próprio em cada uma |
| 4 | Critérios de saída | Seções 2-5, campo próprio em cada uma |
| 5 | Riscos | Por fase (seções 2-5) — nenhum risco novo além dos já catalogados em `ARQ-004.1`/`ARQ-005`/`ARQ-006` |
| 6 | Pontos de rollback | Por fase — sempre via `FB_FLAG`, nunca reconstrução de dado, até o corte final de cada entidade (`ADR-004`) |
| 7 | Feature flags necessárias | `pessoaModelo`, `participacaoModelo`, `setorColecao`, `pgColecao`, `auditoriaEventos` (nomes ilustrativos) — uma por entidade, nunca uma só cobrindo tudo, para nunca misturar fontes numa mesma tela (`ARQ-004.1 §2.6`) |
| 8 | Dados que podem ser migrados primeiro | Setor (ensaio, menor risco) e Pessoa (dependência raiz) — seção 4, seção "Dados que podem ser migrados primeiro" |
| 9 | O que NÃO deve ser alterado junto | Seção 4 — telas, fórmulas de cálculo, Épico 4/5, regras de negócio já homologadas |
| 10 | Estratégia de homologação | Cada fase = 1 RC formal (RC6.x, seguindo a numeração já em uso no projeto), com critério de saída objetivo verificável — nunca por impressão subjetiva, mesmo princípio já usado no IMD v2 |

---

## Recomendação Final

Aprovar este plano como a tradução executável da série `ARQ-001` a `ARQ-007`. A Fase 1 pode
começar assim que autorizada — é, por desenho, a de menor risco possível (nenhuma flag ligada,
nenhum dado de domínio tocado). Nenhuma fase seguinte começa sem a anterior ter sido homologada
com critério objetivo, mesma disciplina já usada em todo o histórico deste projeto.

**Este documento é exclusivamente de planejamento — nenhum código foi escrito, nenhuma flag foi
criada, nenhuma coleção foi tocada.**
