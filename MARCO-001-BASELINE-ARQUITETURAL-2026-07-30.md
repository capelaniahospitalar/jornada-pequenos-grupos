# MARCO-001 — Baseline Arquitetural (2026-07-30)

> Registro de governança, não um documento técnico novo. Marca o ponto oficial em que a etapa de
> **diagnóstico** arquitetural se encerra e a etapa de **implementação** ainda não começou.
> Qualquer trabalho de código a partir daqui deve referenciar este marco como "estado conhecido
> de partida".

---

## 1. Série de diagnóstico concluída

| Documento | Pergunta respondida | Resultado |
|---|---|---|
| `AUDITORIA-RC5.0.md` | Quais bugs pontuais existem? | 17 achados classificados (base herdada, não desta série) |
| `AUDITORIA-ARQ-001.md` | Onde estão os riscos estruturais? | Reclassificação + 4 pilares (Identidade, Persistência, Recuperação, Observabilidade) |
| `ARQ-002-MODELO-CONCEITUAL-DOMINIO.md` | O que existe no domínio? | Catálogo de 18 entidades |
| `ARQ-002.1-DECISAO-IDENTIDADE-PESSOA.md` | Quem é uma Pessoa? | Decisão: `personId` próprio |
| `ADR-003-IDENTIDADE-CANONICA-PESSOA.md` | Registro formal da decisão acima | Aceito (não homologado — implementação pendente) |
| `ARQ-003-MODELO-IDENTIDADE-AUTENTICACAO.md` | Como provar identidade? | Pessoa / `authUid` / recuperação por WhatsApp |
| `ARQ-004-PERSISTENCIA-FONTE-VERDADE-SINCRONIZACAO.md` | Onde o dado deve morar? | Documento único → coleções por entidade |
| `ARQ-004.1-ESTRATEGIA-MIGRACAO-PERSISTENCIA.md` | Como migrar sem perder dado? | Coexistência, validação, rollback (4 fases) |
| `ADR-004-MIGRACAO-PROGRESSIVA-PERSISTENCIA.md` | Registro formal da regra de migração | Aceito (regra permanente) |
| `ARQ-005-RECUPERACAO-BACKUP-CONTINUIDADE.md` | Como recuperar? | Backup manual + audit trail + RPO/RTO realistas |
| `ARQ-005.1-GOVERNANCA-ACESSO-INSTITUCIONAL.md` | Quem administra o sistema? | Risco de conta única identificado; ação humana recomendada |
| `ARQ-006-OBSERVABILIDADE-AUDITORIA-HISTORICO.md` | Como explicar o que aconteceu? | Event Log de domínio + Princípio de Auditoria |
| `ARQ-007-HARDENING-SEGURANCA-PLANO-EVOLUCAO.md` | Como evitar regressão? | Roadmap mestre em 4 fases |

**Achado transversal de toda a série (o mais importante, nas palavras já usadas por você
mesmo):** o aplicativo não carecia de boas ideias — `setorId`, `memberId`, `syncId`,
`historico[]` e `APP_VERSION` já existiam, corretos em sua origem, só não conectados entre si
numa arquitetura coerente. A conclusão final não é "reconstruir", é **organizar**.

## 2. Backup executado

- **Identificação:** `BACKUP-PRE-ARQ-001`
- **Arquivo:** `BACKUP-PRE-ARQ-001_2026-07-30_161601.json` (171.343 bytes)
- **SHA-256:** `60E1344CC7D31E2351366C657AF8C3FD07A1DCF62553F666805E1192E3A1EAFE`
- **Local:** `C:\Users\wladimir.souza\Documents\Backups-JornadaPG\` (fora do repositório Git —
  recomendação pendente: copiar para armazenamento pessoal seguro, Drive/OneDrive)

## 3. Estado conhecido da produção neste marco

| | Valor |
|---|---|
| Total de Pequenos Grupos (array) | 50 |
| PGs com nome definido | 37 |
| Registros de participantes (todos os PGs) | 108 |
| Participantes com tombstone (`removed:true`) | 0 |
| Versão do aplicativo (`APP_VERSION`) | 1.0.0, build 2026-06-30 |
| `updateTime` do documento Firestore no momento do backup | 2026-07-30T18:05:12.440002Z |

## 4. Estado do código-fonte

**Confirmado nesta sessão, não assumido:** `git status -sb` limpo, `git diff HEAD -- index.html`
vazio — **nenhuma linha de `index.html` foi alterada em toda a série ARQ-001 a ARQ-007**. Todo o
trabalho produzido até aqui é documentação (`.md`), mais uma leitura (não-destrutiva) do
Firestore para gerar o backup da seção 2.

- **Commit no momento deste marco:** `1be4d105f003c33008431ff871e9cc9bde57db8d`
  ("principios de auditoria")
- **Tags de baseline já existentes no repositório** (herdadas, anteriores a esta série):
  `v0-pre-concurrency`, `v2a-pre-identidade`, `v3-rc1-baseline`

## 5. O que este marco autoriza e o que não autoriza

- **Autoriza:** iniciar o `PLANO-IMPLEMENTACAO-FASE-1` (documento seguinte), que traduz esta
  série em execução — ainda sem código, é o desenho da ordem de implementação.
- **Não autoriza:** nenhuma alteração de `index.html`, nenhuma criação de coleção no Firestore,
  nenhuma mudança de regra de segurança. Isso permanece condicionado a aprovação explícita,
  documento por documento, como em toda esta série.

---

**Este é um registro de governança — não contém nem autoriza implementação. Nenhum código foi
escrito, nenhuma estrutura de dado em produção foi criada ou alterada.**
