# AUDIT-06-WRITE-CONTRACT — O contrato de escrita e o fluxo de convite

**Auditoria:** Falhas de entrada / reentrada no aplicativo
**Fase:** 6 — Contrato de escrita
**Data de execução:** 2026-08-31
**Baseline de código:** `main` @ `1aafe63` — ver [AUDIT-00-SAFETY.md](AUDIT-00-SAFETY.md)
**Baseline de dados:** instantâneo de produção de 31/08/2026 09:51:54Z
**Alterações de código:** **nenhuma** · **Escritas em produção:** **nenhuma**

---

## Sumário executivo

**A pergunta histórica está respondida: sim, o código publicado corresponde ao estado declarado.**
O fallback dos convites foi removido de verdade, as guardas alcançam o aceite de verdade, e existe
um único ponto de escrita no Firestore em todo o aplicativo. Verifiquei isso **no arquivo baixado
do GitHub Pages**, não na cópia local.

**Mas o contrato é único só no nome.** Abaixo do ponto único de escrita há **três rotas** que
declaram o mesmo campo `dados` de **três maneiras diferentes**, e a rota do convite é a que menos
se parece com as outras — ela não marca pendência, não registra telemetria e não anota conflitos.

E há um defeito de escrita parcial **confirmado em 100% dos registros de produção**: dois campos
são apagados da nuvem toda vez que um aparelho reinicia e grava qualquer coisa.

---

# 1. Verificação do estado declarado

Executada sobre `pages-index.html` — o arquivo **baixado do ar** na Fase 0, cujo SHA-256
(`470d1473655ac85c…`) é idêntico ao do commit `1aafe63`.

| # | Afirmação histórica | Verificação | Resultado |
|---|---|---|---|
| 1 | Existe um ponto único de escrita | um só `method: 'PATCH'` no arquivo inteiro (linha 11099, dentro de `fbWriteGrupos`) | ✅ **Confirmado** |
| 2 | O fallback dos convites foi removido | `remote.dados \|\| PEQUENOS_GRUPOS` só aparece em **comentários** (10158, 10915). O código usa `remote.dados \|\| []` | ✅ **Confirmado** |
| 3 | `gerarConvite` não declara `dados` | intenção = `{operacao:'convite-criar', convites}` | ✅ **Confirmado** |
| 4 | `revogarConvite` não declara `dados` | intenção = `{operacao:'convite-revogar', convites}` | ✅ **Confirmado** |
| 5 | `aceitarConvite` declara `dados` | intenção = `{operacao:'convite-aceitar', dados, convites}` | ✅ **Confirmado** |
| 6 | As guardas alcançam o aceite | `if (temDados) { … validarPayloadDados(intencao.dados) }` (11062/11070) | ✅ **Confirmado** |
| 7 | Nenhuma rota de convite escreve direto | os 3 caminhos passam por `commitConviteChange` → `fbWriteGrupos` | ✅ **Confirmado** |

**Nenhuma divergência entre o declarado e o publicado.** Isto é digno de registro: em auditorias
anteriores deste projeto, correções dadas como aplicadas não estavam no ar. Aqui estão.

> **Nota sobre o fallback:** ele foi trocado por `|| []`, não eliminado. Se a leitura remota não
> trouxer `dados`, o aceite monta uma lista **vazia** — mas nunca chega a gravá-la: `gRem` fica
> indefinido, `validarConviteParaAceite` devolve `grupo_inexistente`, e `validarIntencao`
> recusaria `dados` vazio de qualquer forma. **Três camadas cobrindo o mesmo buraco.** A troca
> foi bem feita.

---

# 2. O pipeline real

```
UI ─────────────► gerarECompartilhar · confirmarEntradaConvite · botões do app
                          │
AÇÃO ───────────► gerarConvite · aceitarConvite · revogarConvite · saveGrupos
                          │
ESTADO LOCAL ───► PEQUENOS_GRUPOS (memória) · localStorage (5 chaves)
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   ROTA 1            ROTA 2            ROTA 3
commitConviteChange  saveGruposToFirebase  salvarFbConfig
   (4 tentativas)     (3 tentativas)     (sem retentativa)
        │                 │                 │
        │            prepareSaveGrupos      │
        │            trySaveGrupos          │
        └─────────────────┼─────────────────┘
                          ▼
PAYLOAD ────────► validarIntencao → guardas → updateMask → pré-condição
                          │
FIRESTORE ──────► fbWriteGrupos · ÚNICO PATCH do aplicativo · linha 11099
```

**O funil existe e é real.** Toda escrita passa por `fbWriteGrupos`, e é lá que moram a barreira
do modo de teste, o contrato de intenção, as seis guardas, a máscara de campos e a pré-condição.

---

# 3. As três rotas, lado a lado

| | **ROTA 1** convite | **ROTA 2** grupos | **ROTA 3** init-nuvem |
|---|---|---|---|
| Função | `commitConviteChange` `10053` | `saveGruposToFirebase` `11411` | `salvarFbConfig` `11638` |
| Operações | `convite-criar`, `-revogar`, `-aceitar` | `grupos` | `init-nuvem` |
| Tentativas | **4** | **3** | **1** |
| Pré-condição | ✅ sim | ✅ sim | ❌ **não** (dívida declarada) |
| Preparo anti-apagamento | ❌ não tem | ✅ `prepareSaveGrupos` | ❌ não |
| **Origem do `dados`** | **cópia literal do remoto** | **projeção de `PEQUENOS_GRUPOS`** | projeção de `PEQUENOS_GRUPOS` |
| `fbGruposPreservados` | implícito (vem no remoto) | ✅ explícito | ❌ **ausente** |
| Marca pendência ao falhar | ❌ **nunca** | ✅ em 7 pontos | ❌ não |
| Telemetria (`recordSync`) | ❌ **nunca** | ✅ em 8 pontos | ❌ não |
| Log de conflito | ❌ **nunca** | ✅ em 3 pontos | ❌ não |
| Estado local antes do `ok` | ✅ intocado | ⚠️ já alterado | ⚠️ já alterado |

**A rota do convite é a mais segura em desenho e a mais cega em operação.**

Ela é a única que monta a alteração em memória contra o remoto fresco e só toca o estado local
depois da confirmação do servidor — o padrão correto. E é a única que **não deixa nenhum rastro**
quando falha.

---

# 4. As seis perguntas

### 4.1 Alguma rota de convite escreve diretamente? — **Não**

Um único `fetch` com `PATCH` no arquivo inteiro. As três operações de convite passam por
`commitConviteChange` → `fbWriteGrupos`. O outro `POST` do arquivo (linha 2881) é o proxy do chat
de IA e não toca dados.

### 4.2 Alguma rota ainda usa código legado? — **Sim, três resquícios**

| Resquício | Onde | Situação |
|---|---|---|
| `MEU_GRUPO_KEY` (formato antigo `jdpg_meu_grupo_v1`) | `loadMeuGrupo`/`saveMeuGrupo` | Ainda **lido e escrito** como espelho de compatibilidade |
| `migrateToVinculos` | `9814` | Migração única; para aparelho novo é código morto |
| `confirmarInscricao` | — | **Removido** (FUNC-02d). Nada o chama |

Nenhum deles escreve na nuvem. `saveMeuGrupo` grava o formato antigo **em localStorage** e depois
chama `upsertVinculo` — dois formatos vivos ao mesmo tempo, mas apenas localmente.

### 4.3 Existe fallback? — **Sim, quatro, de naturezas diferentes**

| Fallback | Onde | Perigoso? |
|---|---|---|
| `remote.dados \|\| []` | `aceitarConvite` `10185` | ❌ Não — três camadas o cobrem (§1) |
| `TUTORS.length ? TUTORS : undefined` | `trySaveGrupos` | ✅ Correto: campo vazio sai da máscara em vez de zerar a nuvem |
| `g.pgIMD \|\| null`, `g.setores \|\| []` etc. | as 3 projeções | ⚠️ **Sim** — ver §5 |
| Cascatas de identidade por nome | 8 réguas (Fase 3) | ⚠️ Sim — assunto da Fase 5 |

O terceiro é o problema: **`|| null` transforma "não sei" em "é nulo"**, e o payload não distingue
"este campo não mudou" de "este campo agora é vazio".

### 4.4 Há duas formas diferentes de persistir? — **Sim. Há três.**

Esta é a resposta mais importante da fase. O mesmo campo `dados` é montado de três jeitos:

**Forma A — cópia literal (rota do convite):**
```js
const dados = JSON.parse(JSON.stringify(remote.dados || []));
```
Copia o remoto **verbatim**. Preserva qualquer campo, inclusive os que esta versão não conhece.
Não depende de lista de campos. **É a forma mais segura contra perda.**

**Forma B — projeção explícita (rota dos grupos):**
```js
const payload = PEQUENOS_GRUPOS.map(g => ({ num: g.num, nome: g.nome, /* …16 campos… */ }));
```
Lista escrita à mão. **Campo fora da lista é descartado.** É o modelo "minha lista inteira
substitui a da nuvem", que o próprio código reconhece como dívida arquitetural (`ARQ-004`).

**Forma C — projeção da inicialização:** outra lista escrita à mão, e **sem** `fbGruposPreservados`
— um aparelho que rode esta rota apaga da nuvem os PGs que ele não conhece. Rota rara, protegida
por confirmação explícita, mas **sem pré-condição de concorrência**.

**Consequência prática:** a rota do convite é *estruturalmente incapaz* de perder um campo; as
outras duas dependem de alguém lembrar de atualizar uma lista. Este é exatamente o defeito já
catalogado no projeto como "campos esquecidos no payload de sync".

### 4.5 A reentrada usa o mesmo contrato do primeiro ingresso? — **Não. Usa duas rotas.**

| Situação | Rotas envolvidas |
|---|---|
| Primeiro ingresso (Cenário A) | apenas **Rota 1** |
| Reentrada no mesmo PG (B, C, E, G) | apenas **Rota 1** |
| **Reentrada vindo de outro PG** (troca) | **Rota 2 + Rota 1**, nessa ordem |

> ### 🔴 F-57 — A troca de PG mistura os dois contratos numa única ação do usuário
>
> `confirmarEntradaConvite` → modal → `removerDoGrupoAtual()` → `saveGrupos()` (**Rota 2**,
> não aguardada) e, na sequência imediata, `aceitarConvite()` (**Rota 1**).
>
> Duas escritas concorrentes ao mesmo documento, com **contratos diferentes, payloads de formas
> diferentes e tratamentos de falha diferentes**, disparadas pelo mesmo toque de dedo. A
> pré-condição impede corrupção — uma será recusada e repetida —, mas:
>
> - se a **Rota 2** falhar de vez, a pessoa fica registrada em **dois PGs** e nada avisa;
> - a Rota 2 marca pendência ao falhar; a Rota 1 não. O estado de "algo ficou para trás" fica
>   pela metade.

### 4.6 Alguma escrita é parcial? — **Sim, e está confirmada em produção**

Ver §5.

---

# 5. Escrita parcial — o defeito confirmado

## 5.1 As quatro listas de campos que precisam concordar

| # | Função | Direção | Campos explícitos |
|---|---|---|---|
| 1 | `saveGruposLocal` `9698` | memória → localStorage | 14 |
| 2 | `loadGrupos` `9663` | localStorage → memória | 12 |
| 3 | `trySaveGrupos` `11361` | memória → nuvem | **16** |
| 4 | `applyGruposData` `11147` | nuvem → memória | **16** |

As quatro deveriam ser a mesma lista. **Não são.**

```
                      pgIMD     pgRanking
saveGruposLocal    →   ❌ NÃO     ❌ NÃO
loadGrupos         →   ❌ NÃO     ❌ NÃO
trySaveGrupos      →   ✅ SIM     ✅ SIM
applyGruposData    →   ✅ SIM     ✅ SIM
```

## 5.2 O mecanismo de destruição

```
1. O app calcula o índice   →  g.pgIMD = {…}         (em memória)
2. Grava na nuvem            →  pgIMD chega ao Firestore ✅
3. Grava no localStorage     →  pgIMD É DESCARTADO      ❌  (lista 1)
4. Pessoa fecha e reabre     →  loadGrupos             ❌  (lista 2, não lê)
                                g.pgIMD = undefined
5. Qualquer gravação         →  pgIMD: g.pgIMD || null
                                → grava NULL sobre o valor bom na nuvem 💥
```

**Basta uma pessoa reabrir o app e postar uma gratidão para apagar o índice de todos os 70 PGs.**

## 5.3 A prova em produção

| Campo | Valor não-nulo em |
|---|---|
| `pgIMD` | **0 de 70** |
| `pgRanking` | **0 de 70** |
| `pgNivel` | 0 de 70 |
| `setores` | 0 de 70 |
| `institucional` | 0 de 70 |
| `setorId` | **chave ausente em 70 de 70** |
| `historico` | **chave ausente em 70 de 70** |
| `pgId` | **6 de 70** (e 6 dos 49 PGs com nome) |
| `pgProgress` | 22 de 49 |

> ### 🔴 F-58 — Cinco campos são gravados em toda escrita e estão vazios em 100% dos registros
>
> `pgIMD` e `pgRanking` têm o mecanismo **provado** acima. Os outros três (`pgNivel`, `setores`,
> `institucional`) **estão** nas quatro listas e ainda assim são nulos em toda a base — a causa
> não foi isolada nesta fase, mas o efeito é idêntico ao já documentado como "app antigo apaga o
> schema".
>
> Consequências verificáveis: o campo `institucional` do PG 47 e a classificação de setores dos
> 49 PGs, ambos configurados em campanhas anteriores, **não existem mais na nuvem**.
>
> **43 dos 49 PGs com nome não têm `pgId`** — a identidade canônica que o ADR-005 define como
> imutável nunca foi gravada para eles.

## 5.4 O paradoxo

**A rota do convite — a única sem lista de campos — é a única imune a este defeito.** Ela copia o
remoto verbatim; se o valor estiver lá, ele sobrevive. As rotas com "contrato explícito" são as que
perdem campos.

Isto inverte a intuição e merece registro: neste app, **declarar os campos foi mais perigoso do que
copiar tudo**.

---

# 6. A rota do convite é invisível para o diagnóstico

> ### 🔴 F-59 — Nenhuma operação de convite aparece na telemetria de sincronização
>
> `recordSync` e `logSyncConflict` são chamados **exclusivamente** de `saveGruposToFirebase`
> (8 e 3 pontos). A Rota 1 não os chama nunca.
>
> Consequência: o painel de telemetria (`sucesso`, `falha`, `ultimaSync`,
> `lastSuccessfulSyncVersion`) **não enxerga criação, revogação nem aceite de convite**. Um
> aparelho pode falhar em 100% dos aceites e a telemetria dele registrar sucesso total.
>
> **Todo diagnóstico de campo feito a partir dessa telemetria estava cego justamente para o
> fluxo que esta auditoria investiga.**

> ### 🔴 F-60 — O aceite não zera nem respeita a pendência de sincronização
>
> A Rota 1 nunca chama `setFbPendingSync`. Dois efeitos opostos, ambos errados:
>
> **Ao falhar:** nada é marcado. `retryPendingSync` (`10706`) não reenvia — porque não sabe que há
> algo a reenviar. A entrada simplesmente se perde e a pessoa precisa recomeçar.
>
> **Ao dar certo com pendência aberta:** `aplicarLocal()` chama `applyGruposData(dados)` e
> reescreve `GRUPOS_KEY` com o payload derivado do **remoto** — que não contém a alteração local
> pendente. **A alteração pendente é destruída**, e a marca de pendência **continua ligada**.
>
> Compare com a Rota 2, que tem proteção explícita para exatamente isso
> (`syncFromFirebase` `11285`): `fbPendingSync ? mergeGruposData(result.dados, PEQUENOS_GRUPOS) : result.dados`.
> **A rota do convite não tem essa linha.** A correção de 18/08 que criou essa proteção não foi
> estendida ao aceite.

---

# 7. Achados menores

| # | Achado | Sev. |
|---|---|---|
| **F-61** | `FB_FLAGS.debounceMs = 400` é declarada e **nunca lida** — uma única ocorrência no arquivo. Quem ler o código conclui que há debounce; não há. É o item C4 do roadmap, ainda pendente | C |
| **F-62** | A Rota 3 (`init-nuvem`) grava **sem pré-condição** e **sem `fbGruposPreservados`** — dívida declarada em comentário, decisão de 21/08 | B |
| **F-63** | `saveMeuGrupo` mantém dois formatos vivos em localStorage (`jdpg_meu_grupo_v1` + vínculos). Não afeta a nuvem, mas alimenta a rede de recuperação incompleta de `loadMeuGrupo` (F-20) | C |

---

# 8. Balanço do contrato

## O que está certo

| | |
|---|---|
| ✅ | Ponto único de escrita — verificado no arquivo publicado |
| ✅ | Contrato de intenção com allowlist de operações e campos |
| ✅ | `updateMask` em toda gravação — nenhum campo omitido é apagado |
| ✅ | Pré-condição otimista nas duas rotas frequentes |
| ✅ | Guardas de conteúdo alcançando o aceite, como declarado |
| ✅ | Estado local intocado até a confirmação (Rota 1) |
| ✅ | Fallback perigoso dos convites removido, com tripla cobertura |

## O que falta ao contrato

| | |
|---|---|
| ❌ | Uma **fonte única** de campos do PG — hoje são 4 listas manuais que já divergem |
| ❌ | Marca de pendência e telemetria na rota do convite |
| ❌ | Proteção de pendência no `aplicarLocal` do aceite |
| ❌ | Coordenação entre as duas rotas na troca de PG |
| ❌ | Distinguir "campo não mudou" de "campo agora é nulo" |

**O contrato governa a forma da gravação — operação, campos, máscara, pré-condição — e não governa
o conteúdo.** É por isso que ele é obedecido à risca e, ainda assim, cinco campos estão vazios em
toda a base.

---

# 9. Limites desta fase

- **Nada foi executado.** Nenhuma gravação foi feita; as travessias são leitura de código e
  aritmética sobre o instantâneo.
- **A verificação do item 1 (§1) é do arquivo publicado**, comparado por hash. Vale para o commit
  `1aafe63` e para nenhum outro.
- **O mecanismo de destruição do `pgIMD`/`pgRanking` (§5.2) é dedutivo.** As listas divergentes e
  o resultado (0 de 70) são fatos verificados; a cadeia entre os dois é inferência a partir do
  código, **não foi reproduzida em execução**.
- **A causa do vazio em `pgNivel`, `setores` e `institucional` não foi isolada.** Esses três estão
  nas quatro listas e ainda assim são nulos — há outra causa, não identificada aqui.
- **A Rota 3 não foi analisada em profundidade** — é acionada à mão, raramente, e está fora do
  fluxo de entrada.
- **Não foi verificado se as regras do Console correspondem ao `firestore.rules`.** O próprio
  arquivo declara não ser autoritativo.
