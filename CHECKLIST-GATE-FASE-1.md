# CHECKLIST-GATE-FASE-1 — Portão de Governança (não é arquitetura, é checklist)

> Realizado em 2026-07-30. Não é um documento técnico — é o portão que precisa estar 100% marcado
> antes da primeira linha de código da Fase 1 (`PLANO-IMPLEMENTACAO-FASE-1.md`) ser escrita.
> Cada item abaixo foi **verificado agora**, não presumido — onde não pude verificar ou a ação
> depende só de você, está marcado como pendente, com o motivo.

---

## Segurança

- [x] **Backup pré-ARQ válido** — `BACKUP-PRE-ARQ-001`, SHA-256
  `60E1344CC7D31E2351366C657AF8C3FD07A1DCF62553F666805E1192E3A1EAFE`, conteúdo relido e
  confirmado (`MARCO-001`).
- [ ] **Acesso administrativo Firebase duplicado** — recomendado no `ARQ-005.1`, ainda não
  confirmado como feito. **Só você pode executar** (exige login na conta Google do projeto).
- [x] **Repositório sincronizado** — verificado agora: `git fetch` + `git status -sb` →
  `main` igual a `origin/main`, sem pendências.
- [ ] **Branch de evolução criada** — ainda não existe. Toda esta série (`ARQ-001` a
  `PLANO-IMPLEMENTACAO-FASE-1`) foi produzida direto na `main` — sem risco, porque é só
  documentação (nenhuma alteração em `index.html`). **A partir da Fase 1, isto muda**: a primeira
  alteração de código deveria nascer numa branch separada, não direto na `main`. Ver pergunta ao
  final deste documento.

## Controle

- [ ] **Feature flag definida** — nomes propostos (`pessoaModelo`, `participacaoModelo`, etc.,
  `PLANO-IMPLEMENTACAO-FASE-1 §6`), mas **nenhuma existe no código ainda** — definir é diferente
  de implementar; a implementação é o primeiro passo de código da própria Fase 1, não algo que já
  deveria estar pronto antes dela.
- [x] **Plano de rollback definido** — `ADR-004` + `ARQ-004.1` + `PLANO-IMPLEMENTACAO-FASE-1`,
  consistente nos três documentos.
- [x] **Critérios de homologação definidos** — critérios de entrada/saída por fase já em
  `PLANO-IMPLEMENTACAO-FASE-1 §2-5`.

## Dados

- [x] **Baseline preservado** — `MARCO-001`.
- [x] **Quantidade de PGs conhecida** — 50 no array, 37 com nome definido.
- [x] **Quantidade de participantes conhecida** — 108 registros, 0 com tombstone.
- [x] **Hash do backup registrado** — seção "Segurança", acima, e `MARCO-001 §2`.

## Processo

- [ ] **RC identificada** — **não decidido ainda.** O projeto já tem um roadmap `RC5.1-RC5.5`
  registrado (`AUDITORIA-RC5.0.md §6`), nunca iniciado, que cobria uma parte menor do que esta
  série ARQ acabou revelando. Esta Fase 1 poderia ser tratada como `RC5.1` (continuando a
  numeração já aberta) ou como um novo eixo `RC6.x` (reconhecendo que o escopo mudou de
  "correções pontuais" para "evolução estrutural"). **Decisão sua, não técnica** — ver pergunta
  ao final.
- [ ] **Changelog preparado** — nenhuma entrada rascunhada ainda no `CHANGELOG.md`; natural
  que isso só aconteça quando a RC (item acima) for identificada.
- [x] **Auditoria antes/depois planejada** — o próprio mecanismo de painel de diagnóstico
  comparativo (`ARQ-004.1 §2`, pergunta 3) já é o plano de "antes/depois" para toda fase.

---

## Resultado da verificação

**9 de 13 itens concluídos.** Os 4 pendentes se dividem em dois grupos:

1. **Dependem só de você, fora do meu alcance** (não são ações de código nem de repositório):
   segundo administrador Firebase, cópia do backup para um local externo seguro (Drive/OneDrive
   — o arquivo hoje só existe no seu computador local).
2. **Dependem de uma decisão sua antes de eu prosseguir** (branch e numeração de RC) — ver
   perguntas a seguir. Não vou criar a branch nem atribuir um número de RC sem essa confirmação,
   porque ambos afetam convenções já estabelecidas neste projeto.

**Este documento é um checklist de governança — não contém nem autoriza nenhuma alteração de
código, repositório ou infraestrutura por si só.**
