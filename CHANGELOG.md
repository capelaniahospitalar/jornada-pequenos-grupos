# CHANGELOG — Jornada Discipular em Pequenos Grupos

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
