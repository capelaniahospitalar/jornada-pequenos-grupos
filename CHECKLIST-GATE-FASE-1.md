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
- [x] **Branch de evolução criada** — `evolucao-arquitetural-fase1`, criada localmente em
  2026-07-30 a partir do HEAD da `main` (commit `6884b40`, "Create CHECKLIST-GATE-FASE-1.md").
  **Só local — não publicada, `main` intocada.** Confirmado: `git status -sb` na nova branch não
  mostra rastreamento remoto (`## evolucao-arquitetural-fase1`, sem `...origin/...`).

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

- [x] **RC identificada** — **RC6.0 — Fundação Arquitetural.** Decidido em 2026-07-30: a RC5
  fica formalmente encerrada como ciclo de auditoria/correções/estabilização (RC5.1-RC5.5 do
  roadmap da RC5.0 continuam registrados, mas não fazem mais parte do eixo desta evolução); a
  partir daqui, todo trabalho de identidade/persistência/migração/auditoria desta série passa a
  ser rastreado como RC6.0. Objetivo formal registrado: *"Implementar a fundação necessária para
  transformar o aplicativo de um modelo monolítico local/documental para uma arquitetura
  orientada a entidades, mantendo compatibilidade, reversibilidade e zero perda de dados."*
- [ ] **Changelog preparado** — nenhuma entrada rascunhada ainda no `CHANGELOG.md`; natural
  que isso só aconteça quando a RC (item acima) for identificada.
- [x] **Auditoria antes/depois planejada** — o próprio mecanismo de painel de diagnóstico
  comparativo (`ARQ-004.1 §2`, pergunta 3) já é o plano de "antes/depois" para toda fase.

---

## Resultado da verificação

**11 de 13 itens concluídos.** Restam 2 pendentes, e os dois são **bloqueadores obrigatórios**
para o primeiro código da RC6.0, por decisão explícita de 2026-07-30 — não itens "recomendados",
itens que travam o início:

1. **Backup externo do `BACKUP-PRE-ARQ-001`** — hoje o arquivo só existe em
   `C:\Users\wladimir.souza\Documents\Backups-JornadaPG\`, no computador local. Precisa ser
   copiado para um local externo (Google Drive/OneDrive) antes de qualquer alteração estrutural.
   Só você pode fazer isso.
2. **Segundo administrador Firebase** (`ARQ-005.1`) — só você pode executar, exige login na
   conta Google do projeto.

**Enquanto esses dois itens não forem resolvidos, nenhum código da RC6.0 deve ser escrito** —
mesmo já existindo a branch `evolucao-arquitetural-fase1` pronta para recebê-lo.

## Decisão de Governança Registrada (2026-07-30)

```
Autorizado:
1. Branch local "evolucao-arquitetural-fase1" criada a partir da main — não publicada.
2. Ciclo renomeado: RC6.0 — Fundação Arquitetural (RC5 encerrada como auditoria/correção/
   estabilização).
3. Backup externo + segundo administrador Firebase seguem como pendências obrigatórias
   antes de qualquer código.
4. Após a branch, aguardar definição do primeiro escopo da RC6.0.
```

**Este documento é um checklist de governança — não contém nem autoriza nenhuma alteração de
código além da criação da branch (ação de repositório local, reversível, já executada e
registrada acima).**
