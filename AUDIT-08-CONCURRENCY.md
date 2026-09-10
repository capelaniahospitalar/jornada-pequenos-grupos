# AUDIT-08-CONCURRENCY — Concorrência e sobrescrita no documento único

**Auditoria:** Falhas de entrada / reentrada no aplicativo
**Fase:** 8 — Concorrência, versões antigas e sobrescrita
**Data de execução:** 2026-08-31
**Baseline de código:** `main` @ `1aafe63` — ver [AUDIT-00-SAFETY.md](AUDIT-00-SAFETY.md)
**Baseline de dados:** instantâneo de 31/08/2026 13:16:32Z (o segundo — ver adendo §10 da Fase 0)
**Alterações de código:** **nenhuma** · **Escritas em produção:** **nenhuma**

> Todas as simulações desta fase são **aritméticas sobre os instantâneos capturados**. Nenhuma
> escrita foi emitida, nenhuma função do aplicativo foi executada.

---

## As três respostas, em uma linha cada

| Pergunta | Resposta |
|---|---|
| **A escrita de B preserva a entrada de A?** | ✅ **Sim** — a entrada em si é robusta |
| **Uma versão antiga pode sobrescrever a entrada recém-feita?** | ⚠️ **Depende do slot.** Nos PGs 1–50, não. **Nos PGs 51–70, apaga o grupo inteiro** |
| **Dois aceites próximos no tempo colidem?** | ⚠️ **Colidem e se resolvem** — mas a janela de colisão é enorme por causa do tamanho do documento |

E um achado que atravessa as três:

> ### 🔴 F-70 — A correção de 26/08 ("local não vence empate") foi aplicada ao grupo e **não aos participantes dentro dele**
>
> O merge de campos do grupo passou a usar `resolverCampoIdentidade` — "só empurra o que mudou
> aqui". **O merge da lista de participantes continua com a regra antiga**, em que o empate é
> vencido pela cópia local:
>
> ```js
> if (lu >= ru) merged[idx] = lp;   // >= : empate vai para o LOCAL
> ```
>
> E o aceite **nunca carimba `updatedAt` no participante** — em nenhum dos três ramos. Criar,
> recuperar identidade e mudar papel são todos invisíveis para essa comparação.
>
> **Em produção: 50 dos 258 participantes ativos não têm carimbo nenhum** (nem `updatedAt`, nem
> `progresso.updatedAt`). Para esses, `lu` e `ru` valem 0, o empate é permanente, e **qualquer
> aparelho com cópia velha vence sempre.**

---

# 1. Cenário A → B: a escrita de B preserva A?

## 1.1 O caso sequencial

```
A: GET (updateTime = T0)  →  dados = cópia literal do remoto + participante A
   PATCH com precondição T0  →  OK, documento vira T1

B: GET (updateTime = T1)  →  o remoto JÁ CONTÉM A
   dados = cópia literal do remoto + participante B
   PATCH com precondição T1  →  OK
```

✅ **A é preservado.** E por um motivo estrutural, não por sorte: `aceitarConvite` monta `dados`
como **cópia literal do remoto recém-lido** (`JSON.parse(JSON.stringify(remote.dados))`). Ele não
tem opinião sobre o resto do documento — só acrescenta.

## 1.2 O caso entrelaçado (o que realmente acontece em campo)

```
A: GET (T0)  ──────────────┐
B: GET (T0)  ──────────┐   │
A: PATCH (T0) → OK, doc = T1
B: PATCH (T0) → 400 FAILED_PRECONDITION
B: espera 80–200 ms aleatórios
B: GET (T1) → agora enxerga A
B: PATCH (T1) → OK
```

✅ **A é preservado.** A trava otimista faz exatamente o que promete, e cada retentativa relê o
documento do zero — nunca reaproveita um retrato velho.

## 1.3 O caso misto: A aceita (rota 1) e B salva algo comum (rota 2)

Este é o mais frequente na prática, porque a rota 2 é disparada por qualquer coisa — postar uma
gratidão, registrar um encontro, sincronizar progresso.

```
B: prepareSaveGrupos → GET → remote.ts ≠ fbLastKnownTs
   → applyGruposData(mergeGruposData(remote.dados, PEQUENOS_GRUPOS))
   → trySaveGrupos com precondição do MESMO GET
```

`mergeGruposData` começa com `merged = [...remoteParts]`. O participante A **está** no remoto e
**não está** no local de B → cai no ramo `merged.push(lp)`? Não: ele já está em `merged`, vindo do
remoto, e o laço local nunca o toca.

✅ **A é preservado.**

## 1.4 Onde o caso misto quebra

O ramo perigoso é o outro: quando o participante existe **nos dois lados** com a mesma chave
(`ts || nome`) e o aceite alterou algo nele **sem carimbar `updatedAt`**.

| Ação do aceite | Carimba `updatedAt`? |
|---|---|
| Cria participante novo | ❌ **não** (só `ts`) |
| **Recupera identidade** (IDENT-01: adota o `memberId` novo) | ❌ **não** |
| Muda `tipo` / `papel` | ❌ **não** |
| *(Para comparação)* remover participante | ✅ sim, `pRemovido.updatedAt = Date.now()` |

**A única mutação de participante que carimba é a remoção.** Tudo o que o aceite faz é mudo.

Sequência que reverte silenciosamente:

```
1. Pessoa P existe há semanas, sem updatedAt.
2. Celular B sincroniza → cópia local de P.
3. Celular A aceita convite → IDENT-01 recupera P → memberId NOVO na nuvem.
   (updatedAt não muda)
4. Celular B tem alteração pendente → mergeGruposData
   → P casa por ts · lu (0) >= ru (0) → VERDADEIRO → local substitui remoto
5. B grava → o memberId de P volta ao antigo.
```

**A recuperação de identidade de A é desfeita por B, sem que nenhum dos dois perceba.** O mesmo
vale para a promoção a coordenador feita por um convite de coordenador.

Isto é o gêmeo, no nível do participante, do defeito que foi corrigido no nível do grupo em 26/08.

## 1.5 Exposição medida

| Medida | Valor |
|---|---|
| Participantes ativos | 258 |
| Sem `updatedAt` no topo | **236** |
| **Sem `updatedAt` e sem `progresso.updatedAt`** | **50** |
| PGs com pelo menos 1 participante sem carimbo | **28** |
| PGs em que **todos** os participantes estão sem carimbo | **4** (PGs 27, 31, 53, 54) |

Os 50 sem carimbo nenhum são, tipicamente, **quem entrou e ainda não fez nada** — nenhum estudo,
nenhuma missão, nenhuma sincronização de progresso. Ou seja: **exatamente a pessoa que acabou de
aceitar o convite é a mais vulnerável a ter a entrada desfeita**, até a primeira vez que ela gerar
progresso.

---

# 2. Uma versão antiga pode sobrescrever a entrada recém-feita?

## 2.1 A distinção que decide tudo

> **A pré-condição protege contra *entrelaçamento*, não contra *ignorância*.**

`currentDocument.updateTime` só garante que o documento não mudou **entre a leitura e a escrita
daquele mesmo cliente**. Um aplicativo antigo que lê o documento fresco, descarta o que não
entende e grava o resto está, do ponto de vista do servidor, fazendo uma gravação perfeitamente
legítima — baseada num retrato atual.

**Nenhuma trava otimista impede isso.** Só uma regra do servidor impediria — e ela existe escrita,
no `firestore.rules`, sob o título "PROPOSTA — ETAPA M2 · **NÃO PUBLICADA** · NÃO ESTÁ VALENDO".

## 2.2 As defesas são todas do lado do cliente, e todas têm data

| Defesa | Introduzida em | Um app anterior a essa data tem? |
|---|---|---|
| `fbGruposPreservados` (guarda PGs desconhecidos) | 18/08 | ❌ não |
| Guardas G1–G4 (perda, esvaziamento, colisão, invariantes) | 21/08 | ❌ não |
| `resolverCampoIdentidade` (não retroceder escalares) | 26/08 | ❌ não |
| Guarda G6 de schema | 21/08 | ❌ não |
| **Regra M2 no servidor** | — | **não publicada — não protege ninguém** |

Toda a proteção está escrita em JavaScript que o aparelho antigo **não executa**.

## 2.3 A resposta, em três categorias

| O que foi recém-feito | Sobrevive a um app antigo? | Por quê |
|---|---|---|
| **Participante novo num PG que o app antigo conhece (1–50)** | ✅ **Sim** | Ele lê o remoto, `applyGruposData` substitui `participantes` inteiro pelo que veio da nuvem, e devolve isso na gravação. A pessoa está no retrato que ele leu |
| **Participante num PG acima do alcance dele (51–70)** | ❌ **Não. O PG inteiro é apagado** | O slot não existe no `PEQUENOS_GRUPOS` compilado: `applyGruposData` faz `if (idx < 0) return`, e sem `fbGruposPreservados` ele não volta no payload |
| **Campos de schema novo** (`pgIMD`, `pgRanking`, `institucional`, `pgId`) | ❌ **Não** | Projeção com `\|\| null` grava nulo por cima |

**Portanto: a entrada em si é robusta; o PG que a contém é que pode desaparecer.**

## 2.4 Exposição medida, hoje

| | |
|---|---|
| Slots 51–70 existentes no documento | 20 |
| **Slots acima de 50 com conteúdo real** | **4** — PGs 51, 52, 53 e 54 |
| **Participantes ativos que sumiriam junto** | **4** |

Um único aparelho rodando a versão de 50 slots, sincronizando e gravando qualquer coisa, apaga
**4 Pequenos Grupos e 4 pessoas** da nuvem. É a repetição exata do incidente do PG 51 — e a
condição para que aconteça de novo **está de pé**.

> ### 🔴 F-71 — A janela do incidente do PG 51 continua aberta
>
> Nada no sistema impede hoje que um aparelho com app antigo apague os PGs 51–54. As guardas que
> foram criadas para isso vivem no app **novo**; o app antigo não as tem. A única barreira que
> funcionaria — a regra M2 no servidor — está escrita e não publicada.
>
> E o carimbo de versão congelado (achado §2.1 da Fase 0) **impede detectar** quais aparelhos
> ainda estão velhos: o app de 21/08 e o de 28/08 se anunciam com o mesmo número.

## 2.5 O caminho inverso: o app novo detecta o antigo?

Parcialmente, e nada disso está ativo:

- **G6** (`fbSchemaRemoto > SCHEMA_VERSION`) só barra um app **mais novo que a nuvem** — protege
  contra o futuro, não contra o passado.
- **`schemaVersion` nunca é gravado** (flag desligada), então `fbSchemaRemoto` é sempre 1 e G6
  nunca dispara.
- A metade que faltava — impedir que uma versão **antiga** grave — é, por construção, o passo B
  da regra M2. Não publicado. E **defeituoso como está escrito**: bloquearia todas as gravações a
  partir da segunda.

---

# 3. Celular A e celular B, dois aceites próximos no tempo

## 3.1 O mecanismo funciona

Já demonstrado em §1.2: precondição + releitura por tentativa + espera aleatória. **Não encontrei
falha na lógica de concorrência do aceite.**

## 3.2 Mas a janela é larga demais

O problema não é a lógica — é o tempo que cada tentativa leva. Da Fase 7:

| Etapa de uma tentativa | Bytes |
|---|---|
| GET do documento | 400 KB |
| PATCH | 396 KB |
| **Total por tentativa** | **795 KB** |

Numa rede hospitalar, uma tentativa pode levar **dezenas de segundos** — e o upload de 396 KB é a
parte lenta. Durante toda essa janela, **qualquer gravação de qualquer aparelho invalida a
precondição**: uma gratidão postada, um encontro registrado, um progresso sincronizado.

```
A: GET ────────── 15 s ────────── PATCH ──── 20 s ────► OK
B:      GET ─── 15 s ─── PATCH ─── 20 s ───► FAILED_PRECONDITION
        ↺ tentativa 2 (mais 35 s)
        ↺ tentativa 3 (mais 35 s)
        ↺ tentativa 4 (mais 35 s)  →  "Convite indisponível"
```

> ### 🔴 F-72 — O tamanho do documento é o que transforma concorrência em falha
>
> Com 4 tentativas de ~35 s, um aceite pode levar **mais de 2 minutos** e ainda assim falhar —
> exibindo *"Este convite não existe ou não está mais disponível"* (F-22), que é falso.
>
> A espera aleatória de **80–200 ms** foi dimensionada para gravações rápidas. Diante de
> tentativas que duram dezenas de segundos, ela é irrelevante: não escalona nada e não separa os
> dois aparelhos.
>
> **E isso piora sozinho com o tempo.** 55% do payload é o registro de convites, que nunca é
> podado (F-30). Cada convite pendente acumulado alarga a janela de colisão de todos os aceites
> futuros.

## 3.3 Quantos aparelhos disputam o documento

Um único documento (`jdpg/grupos`) para **49 PGs ativos e 258 participantes**. Toda pessoa que usa
o app é uma escritora potencial do mesmo documento.

O polling de 30 s **só lê**, não grava — isso é correto e importante. Mas cada progresso
sincronizado, cada gratidão, cada encontro registrado é uma escrita completa de 396 KB no mesmo
documento que os aceites disputam.

---

# 4. O quadro de sobrescrita

| Cenário | Sobrescreve? | Protegido por |
|---|---|---|
| B aceita depois de A (mesmo PG) | ❌ Não | cópia literal do remoto |
| B aceita ao mesmo tempo que A | ❌ Não | precondição + releitura |
| B salva algo comum enquanto A aceita | ❌ Não | `mergeGruposData` parte do remoto |
| **B reverte a recuperação de identidade de A** | ✅ **SIM** | — **nada** (F-70) |
| **B reverte a mudança de papel feita por A** | ✅ **SIM** | — **nada** (F-70) |
| App antigo, PG dentro do alcance dele | ❌ Não | participantes vêm do remoto |
| **App antigo, PG acima do alcance dele** | ✅ **SIM — apaga o PG** | — **nada** (F-71) |
| **App antigo, campos de schema novo** | ✅ **SIM — nula** | — nada |
| **O próprio aceite contra a pendência local do aparelho** | ✅ **SIM** | — nada (F-60) |

**Cinco caminhos de sobrescrita continuam abertos.** Nenhum deles é de concorrência mal resolvida
— todos são de *conhecimento desigual*: um lado sabe menos que o outro e grava assim mesmo.

---

# 5. Achados novos da Fase 8

| # | Achado | Sev. |
|---|---|---|
| **F-70** | A correção de 26/08 cobre 8 campos do grupo e **não cobre a lista de participantes**; o aceite nunca carimba `updatedAt`, e o empate vai para a cópia local. 50 dos 258 ativos sem carimbo nenhum | **A** |
| **F-71** | A janela do incidente do PG 51 continua aberta: **4 PGs e 4 pessoas** seriam apagados por um aparelho com app de 50 slots. A única defesa possível (regra M2) está escrita e não publicada | **A** |
| **F-72** | Cada tentativa move 795 KB; 4 tentativas passam de 2 minutos. A espera aleatória de 80–200 ms foi dimensionada para gravações rápidas e é irrelevante nesta escala | **A** |
| **F-73** | O modelo de documento único faz de cada participante um escritor concorrente do mesmo registro de 400 KB — a taxa de colisão cresce com o número de pessoas **e** com o lixo acumulado de convites | B |

---

# 6. O que está certo — e é a maior parte

Vale dizer com clareza, porque a arquitetura de documento único costuma ser acusada de tudo:

| | |
|---|---|
| ✅ | Trava otimista por carimbo do **servidor** — não há perda de atualização por entrelaçamento |
| ✅ | Releitura completa a cada tentativa — nenhuma retentativa usa retrato velho |
| ✅ | Espera aleatória entre tentativas — quebra o lock-step (embora mal dimensionada) |
| ✅ | O aceite copia o remoto literalmente — não tem opinião sobre o que não é dele |
| ✅ | `mergeGruposData` parte do remoto e une gratidões, encontros, campanhas e semanas |
| ✅ | Tombstone com carimbo — remoção concorrente não é ressuscitada |
| ✅ | Máquina de estados do convite — terminal nunca regride a pendente |
| ✅ | O polling só lê |

**A entrada de um participante é, em si, uma operação bem protegida.** Os cinco caminhos de
sobrescrita que restam não atacam a entrada — atacam o que está em volta dela: o PG que a contém,
o papel que ela conferiu, a identidade que ela reconciliou.

---

# 7. Limites desta fase

- **Nenhuma simulação foi executada.** Não houve dois aparelhos gravando de verdade; as sequências
  são derivadas do código e conferidas contra os instantâneos.
- **Os tempos da §3.2 são estimativas.** 795 KB por tentativa é medido; quantos segundos isso leva
  na rede do hospital **não foi medido**.
- **Não sei quantos aparelhos ainda rodam versões antigas.** O carimbo de versão está congelado
  (Fase 0 §2.1) e não há telemetria de versão por aparelho — a rota do convite nem aparece na
  telemetria existente (F-59).
- **A reversão do F-70 não foi observada em produção.** O mecanismo está provado no código e a
  exposição está medida (50 participantes), mas não identifiquei um caso consumado. Os incidentes
  de reversão já registrados no projeto foram de campos do grupo, não de participantes.
- **A regra M2 não foi testada.** O passo B, como escrito, tem defeito conhecido e não deve ser
  publicado sem revisão.
