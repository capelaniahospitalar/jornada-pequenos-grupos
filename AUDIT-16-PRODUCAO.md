# AUDIT-16-PRODUCAO — Checklist de publicação

**Fase:** 16 — Produção
**Branch:** `audit/fix-invite-reentry` · **Base:** `1aafe63`
**Data:** 2026-08-31
**Status:** 🔴 **NÃO PUBLICADO — publicação não autorizada e checklist incompleto.**

---

## 1. CHECKLIST

```
[x] auditoria concluída
[x] causa raiz confirmada
[ ] correção aprovada          ← NÃO. Nenhuma aprovação explícita do B1 foi dada.
[x] testes aprovados
[x] regressão aprovada
[x] backup realizado
[x] rollback definido
[x] commit identificado
[x] versão incrementada
[ ] publicação autorizada      ← NÃO. Nenhuma autorização explícita foi dada.
[ ] produção verificada        ← só é possível DEPOIS de publicar.
```

**8 de 11 cumpridos. Três em aberto, e dois deles dependem exclusivamente de você.**

---

## 2. Detalhamento

### ✅ Auditoria concluída
13 fases (0–12), 13 documentos, 5 659 linhas. Ver [AUDIT-12-CORRECOES.md](AUDIT-12-CORRECOES.md).

### ✅ Causa raiz confirmada
*O aplicativo modela a entrada como consumo de um token, e não como garantia de pertencimento.*
Confirmada por reprodução em bancada (Fase 10) e detalhada em
[AUDIT-11-ROOT-CAUSE.md](AUDIT-11-ROOT-CAUSE.md).

### ❌ Correção aprovada — **PENDENTE**
A **Opção B** foi aprovada como *estratégia*. O **B1 implementado** ainda não recebeu aprovação.
A própria especificação do B2 condiciona: *"Somente depois que B1 estiver aprovado."*

### ✅ Testes aprovados
**84/84** na suíte embutida: 11 (Fase 4) + 27 (E1) + **46 (B1, nova)**.
Mais **28 sondas dirigidas** de persistência, concorrência, versões e guards.

### ✅ Regressão aprovada
**Zero regressões** nas 38 asserções existentes. Uma regressão foi encontrada durante a Fase 14 —
o desempate por ordem de array em cadastros duplicados —, **corrigida e coberta por três novas
asserções**. Ver [AUDIT-14-REGRESSAO.md](AUDIT-14-REGRESSAO.md).

### ✅ Backup realizado

| Item | Valor |
|---|---|
| Dados de produção | `producao-pre-publicacao-20260831-1542.json` · 396 656 bytes |
| `updateTime` no backup | `2026-08-31T17:58:00.374952Z` |
| SHA-256 | `497e862714b659bef4a7ce95b5aa95eb…` |
| Código publicado atual | `pages-publicado-20260831-1542.html` · SHA-256 `470d1473655ac85c…` |
| Localização | scratchpad da sessão — **fora do repositório** (contém dado pessoal) |

⚠️ **Este backup envelhece.** O documento é escrito por aparelhos em campo o tempo todo (mudou
quatro vezes durante a auditoria). Se a publicação não ocorrer hoje, **refazer o backup na hora**.

### ✅ Rollback definido

**Reverter o código** (efeito imediato, sem tocar em dado):

```bash
git checkout main -- index.html
```

Seguido de commit e publicação pelo GitHub Desktop. O `index.html` volta a ser byte a byte o de
`1aafe63`, cujo SHA-256 é `470d1473655ac85c4d12316bbe089ecb3a89aea8845c226f7304ce30706664f1` —
o mesmo do backup `pages-publicado-20260831-1542.html`.

**Por que o rollback de código é seguro:**

| Alteração do B1 | O que fica no dado após reverter | É problema? |
|---|---|---|
| `p.updatedAt` carimbado | permanece nos registros tocados | ❌ Não — campo já existia e é usado pelo merge |
| `p.removed = false` | permanece: a pessoa continua ativa | ❌ Não — é o estado correto |
| `p.memberId` reconciliado | permanece apontando para o aparelho novo | ❌ Não — é o estado correto |
| `p.wa` preenchido quando vazio | permanece | ❌ Não |
| Convite com `usadoEm` preservado | permanece | ❌ Não |

> **Nenhuma alteração do B1 introduz campo novo nem muda formato.** Todos os campos escritos já
> existiam no schema. Por isso o rollback de código **não exige rollback de dado** — e a versão
> antiga continua lendo tudo normalmente.

**Reverter dado** (só se algo inesperado ocorrer): restauração **seletiva** por `PATCH` a partir do
backup, nunca sobrescrita em bloco — restaurar o documento inteiro apagaria o que os participantes
fizerem entre a publicação e o rollback.

### ✅ Commit identificado

| | |
|---|---|
| Branch | `audit/fix-invite-reentry` |
| Base | `1aafe63` (= `main` = `origin/main`) |
| Commits | 4 |
| **HEAD a publicar** | *(ver §5 — o commit da versão ainda será criado)* |

```
57a0568  Homologacao B1: jornada completa e 5 variantes aprovadas
ccbb917  B1: desempate deterministico em buscarCadastroExistente + regressao
bd3ff3e  B1: aceite de convite idempotente e reconciliacao de identidade
```

### ✅ Versão incrementada

```
antes:  1.2.0-rc1 · build 2026-08-21   (congelada havia 10 commits)
agora:  1.3.0-rc1 · build 2026-08-31
```

`SCHEMA_VERSION` permanece **2** — o formato dos dados não mudou, e é isso que mantém a
compatibilidade com as versões em campo.

⚠️ **A versão continua praticamente invisível na tela.** Ela só aparece dentro do "Detalhes
técnicos" da tela de erro do Companheiro de Jornada. Exibi-la numa tela normal é a correção
**C.4**, ainda não feita — sem ela, incrementar ajuda o histórico mas **não** permite perguntar a
alguém "qual versão aparece aí?".

### ❌ Publicação autorizada — **PENDENTE**
Nenhuma autorização explícita foi dada. Publicar exige duas coisas suas: aprovar o B1 e autorizar
a publicação.

### ⏸️ Produção verificada — **só após publicar**
Roteiro pronto na §4.

---

## 3. Impedimentos que permanecem

Nenhum é regressão. Ambos foram declarados desde a Fase 13.

| # | Impedimento | Gravidade | Consequência de publicar assim mesmo |
|---|---|---|---|
| 1 | **B2 não implementado** | 🟠 | Erro transitório de servidor (5xx, 429) e queda de rede continuam encerrando o aceite **na primeira tentativa**, sem timeout e sem retomada. É a causa contribuinte mais frequente de falha de gravação. **O ciclo de reclamação é quebrado, mas a taxa de falha não cai** |
| 2 | **R2 sem teste de convivência** | 🟡 | O carimbo `updatedAt` muda quem vence o merge. O efeito sobre um aparelho rodando a versão atual, gravando em paralelo, **não foi observado** — não é reproduzível em bancada |

### O que publicar o B1 sozinho resolve, e o que não resolve

| Resolve | Não resolve |
|---|---|
| Reabrir o próprio convite passa a funcionar | Aceite que falha por rede continua perdido |
| Reenviar o mesmo link deixa de ser inútil | Envio de ~396 KB por aceite continua |
| Removido reentra e volta a aparecer | Sem timeout: "Entrando…" pode não terminar |
| Aparelho/navegador novo recupera o cadastro | Convites pendentes continuam sem envelhecer |
| Falha de leitura deixa de virar "convite não existe" | Versão continua invisível na tela |
| Progresso deixa de ser sobrescrito | App continua sem se recarregar sozinho |

---

## 4. Roteiro de verificação pós-publicação

A executar **depois** da publicação, se ela for autorizada.

### 4.1 Antes de tocar em qualquer coisa

```bash
curl -sI https://capelaniahospitalar.github.io/jornada-pequenos-grupos/index.html
```
O `Last-Modified` deve deixar de ser `Fri, 28 Aug 2026 15:57:38 GMT`.
⚠️ O GitHub Pages tem `Cache-Control: max-age=600` — **aguardar 10 minutos** ou abrir com `?v=` e
um número novo. E lembrar: aparelho que só "retoma" o app do segundo plano **não recarrega o
código** (F-74).

### 4.2 Os seis testes de produção

| Teste | Como | Esperado |
|---|---|---|
| **CONVITE NOVO** | Coordenador gera convite para alguém que não é membro; a pessoa abre e entra | Entra; aparece na lista do PG |
| **MESMO CONVITE** | A mesma pessoa abre o mesmo link outra vez | **Entra de novo**, sem a mensagem "utilizado por outra pessoa" |
| **REENTRADA** | Alguém que saiu do PG recebe convite novo e aceita | Volta a **aparecer na lista**, com o XP anterior |
| **IDENTIDADE** | A mesma pessoa abre o app em outro navegador do mesmo celular e aceita um convite | Recupera o cadastro; **não** cria segundo registro; XP preservado |
| **PERSISTÊNCIA** | Conferir na nuvem, após os testes acima | Contagem de participantes correta; nenhum XP alterado; nenhum PG a menos |
| **VERSÃO** | No aparelho testado, conferir `APP_VERSION` | `1.3.0-rc1` / build `2026-08-31` |

### 4.3 Verificação de não destruição, obrigatória

Comparar o documento contra o backup `producao-pre-publicacao-20260831-1542.json`:

- número de PGs: **igual ou maior**, nunca menor;
- participantes ativos por PG: igual ou maior;
- XP de cada participante: **nunca menor**;
- os 4 PGs acima do slot 50 (51, 52, 53, 54) continuam presentes.

**Qualquer redução em qualquer um desses números → executar o rollback da §2 imediatamente.**

### 4.4 Janela de observação

Publicar **em horário de baixo uso** e acompanhar por pelo menos 24 h. O documento é escrito por
aparelhos em campo continuamente — foi alterado quatro vezes durante esta auditoria.

---

## 5. O que falta, exatamente

Para que esta fase possa ser concluída, preciso de **duas frases suas**:

1. **"B1 aprovado"** — libera o commit da versão incrementada e, se você quiser, o início do B2.
2. **"Publicação autorizada"** — libera a publicação na `main`.

Sem a segunda, nada vai ao ar. Com a primeira apenas, sigo para o B2.

**Minha recomendação:** aprovar o B1, implementar o B2, e publicar os dois juntos. O B1 sozinho já
quebra o ciclo de reclamação, mas deixa ativa a causa contribuinte que mais faz o aceite falhar.

---

## 6. Estado neste momento

| | |
|---|---|
| `main` | `1aafe63` — **intocada**, idêntica a `origin/main` |
| Branch | `audit/fix-invite-reentry`, commits **locais**, sem push |
| `firestore.rules` | **intocado** |
| Publicado | continua o `index.html` de 28/08 |
| Escritas em produção | **nenhuma** em toda a auditoria |
| Backup | feito hoje, **fora do repositório** |
