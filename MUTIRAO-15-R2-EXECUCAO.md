# MUTIRÃO DE NATAL 2026 · R2 — REGISTRO DE EXECUÇÃO EM PRODUÇÃO

**Data:** 2026-09-09 · **Base:** commit `2380e00` (branch `audit/fix-invite-reentry`)
**Protocolo:** `MUTIRAO-13-PROTOCOLO-R2.md` · **Arquitetura:** `MUTIRAO-14`

> Este documento é a **evidência**, não o plano. O plano está no `MUTIRAO-13`. Aqui ficam as
> respostas literais que o Firestore de produção devolveu, com carimbo de tempo, para que a
> homologação não dependa da lembrança de ninguém.

| Etapa | Estado |
|---|---|
| Regra publicada no Console | ✅ 09:54 |
| **R2-A** gravação real | ✅ **aprovado** |
| **R2-B** conferência independente | ✅ **aprovado** |
| **R2-C** ⭐ pré-condição de concorrência | ✅ **APROVADO — marco de homologação** |
| **R2-C §5.1** recuperação do laço | ✅ **aprovado** |
| R2-D dois aparelhos simultâneos | ⏸️ não executado |
| R2-E persistência e reentrada | ⏸️ não executado |
| Limpeza por tombstone | ⏸️ pendente |

---

# 0. Método — e o desvio que foi necessário

O protocolo mandava abrir o app **sem** `?teste=1`. **Isso não foi feito, e não deve ser.**

Auditoria do caminho de inicialização, antes de abrir qualquer página:

```
carregar sem ?teste=1
  └─ syncFromFirebase()              lê jdpg/grupos
       └─ migrarSetoresParaMestre()
            └─ if (mudou) saveGrupos()
                 └─ saveGruposToFirebase()   ← GRAVA em jdpg/grupos
```

**Só de carregar a página, o app pode gravar nos 70 PGs reais**, sem nenhum clique. Não é hipótese: foi o que aconteceu em 05/08 e 07/08, quando o campo `status` foi gravado em produção por uma migração automática.

Agravante encontrado: o navegador usado tinha **`jdpg_grupos_v1` real em cache local** (70 slots, 48 com nome), de uma sessão anterior sem `?teste=1`. Aberto em modo normal, o app teria dado local para empurrar.

**Método adotado, autorizado pelo usuário:** carregar **com** `?teste=1` — o app fica isolado, não lê produção, não migra, não faz polling — e emitir as chamadas do R2 **explicitamente** pelo console, usando as funções reais `loadFbConfig()` e `mutiraoDocUrl()` do app para montar o endereço.

**Limitação registrada:** o corpo de `mutiraoFbWrite` foi reproduzido em vez de chamado (a barreira do modo de teste está dentro dele e é `const`). O endereço vem da função real; o corpo, a máscara e a pré-condição são idênticos ao caminho de produção. O que o R2 acrescenta é o **servidor real**, e isso foi exercitado por inteiro — o wrapper já tem 26 provas automatizadas.

---

# 1. Verificação da regra publicada — antes de qualquer escrita

`GET jdpg/mutirao/2026/999`

```
HTTP 404
{"error":{"code":404,"message":"Document \"projects/jornada-pequenos-grupos/databases/
(default)/documents/jdpg/mutirao/2026/999\" not found.","status":"NOT_FOUND"}}
```

**404, e não 403, é a prova de que a regra está valendo:** o `allow read: if true` autorizou a leitura; o documento é que ainda não existia. Sem a regra publicada, a resposta seria `403 PERMISSION_DENIED`.

O PG de teste é o **999**, que não existe. Com um documento por PG, as entregas de teste vivem num documento à parte, que nenhuma tela lê.

---

# 2. R2-A — a primeira gravação real

```
PATCH .../documents/jdpg/mutirao/2026/999
      ?key=…
      &updateMask.fieldPaths=entregas
      &updateMask.fieldPaths=ts
      &updateMask.fieldPaths=schemaVersion
      &currentDocument.exists=false
```

| | |
|---|---|
| **HTTP** | **200** |
| `name` devolvido pelo servidor | `…/documents/jdpg/mutirao/2026/999` |
| `createTime` | `2026-09-09T13:18:28.484138Z` |
| `updateTime` | `2026-09-09T13:18:28.484138Z` |
| Tempo | 343 ms |

`createTime` igual a `updateTime` prova que o documento **nasceu** ali — não foi sobrescrito. A pré-condição `exists=false` foi honrada.

**O que isto prova:** a regra aceita a gravação; o endereço montado pela função real do app está correto (o `name` veio do servidor, não de mim); a forma do documento passa no `hasOnly`.

---

# 3. R2-B — conferência independente, só leitura

## 3.1 O documento do Mutirão

| | |
|---|---|
| Campos presentes | **`entregas`, `schemaVersion`, `ts`** — os três, nenhum a mais |
| `schemaVersion` | `1` |
| Total de entregas | 1 |

A entrega lida de volta é **idêntica campo a campo** à autorizada, com `entregaId` `4edefa01-2cbe-43e8-92bd-b105ca5b687a`, `pgNum: 999`, marcador `R2-TESTE`, sem nenhum dado de pessoa real.

## 3.2 `jdpg/grupos` — a prova de que não foi tocado

| | |
|---|---|
| `updateTime` dos grupos | **`2026-09-09T13:02:32.770304Z`** |
| Nosso PATCH | `2026-09-09T13:18:28.484138Z` |
| Diferença | **−16 minutos** |

**O documento dos 70 PGs foi alterado pela última vez 16 minutos ANTES da nossa gravação.** Se tivéssemos escrito nele, o carimbo seria posterior. É prova conclusiva e independente de qualquer afirmação minha.

Os 6 campos de topo seguem presentes (`dados`, `ts`, `tutores`, `convites`, `setoresMestre`, `setoresEfetivo`), com `dados` em 179.534 bytes. O conteúdo de `dados` **não foi inspecionado** — tem nomes de participantes reais e não havia motivo.

> ⚠️ **O monitor de rede do navegador não serve como evidência aqui:** ele não registra as chamadas
> feitas pelo console. Foi descartado, e a prova ficou sendo o carimbo de tempo.

---

# 4. ⭐ R2-C — a pré-condição de concorrência no Firestore real

**O marco de homologação deste R2.** Até aqui, a trava só tinha sido provada contra um servidor falso escrito pelo próprio assistente.

Método: ler **uma vez**, guardar o carimbo, e gravar **duas vezes** usando exatamente esse mesmo carimbo, sem atualizá-lo entre as duas.

**Carimbo usado nas duas:** `2026-09-09T13:18:28.484138Z`

## 4.1 Primeira gravação — ACEITA

| | |
|---|---|
| HTTP | **200** |
| `updateTime` novo | `2026-09-09T13:21:51.382227Z` |

## 4.2 Segunda gravação, mesmo carimbo — RECUSADA

| | |
|---|---|
| HTTP | **400** |
| `status` | **`FAILED_PRECONDITION`** |
| Mensagem literal | `the stored version (1788960111382227) does not match the required base version (1788959908484138)` |

Os dois números são carimbos em microssegundos:

| | |
|---|---|
| `1788959908484138` | `13:18:28.484138Z` — a versão que eu exigi |
| `1788960111382227` | `13:21:51.382227Z` — a que o documento realmente tinha |

**O servidor percebeu que a versão havia mudado e recusou.** É exatamente o cenário de dois aparelhos gravando a partir da mesma leitura.

## 4.3 A recusa não deixou rastro

| | |
|---|---|
| Entregas no documento | **2** |
| Quilos gravados | `[1, 2]` |
| A entrega de 3 kg (a recusada) entrou? | **NÃO** |
| `updateTime` | `13:21:51.382227Z` — o da 1ª gravação, inalterado |

A recusa foi **total**: sem gravação parcial, sem corrupção, sem avanço de carimbo. E a entrega do R2-A foi preservada pela 1ª gravação.

## 4.4 O que isto muda

A trava deixou de ser **uma propriedade do código** e passou a ser **uma propriedade observada no backend de produção**. É a diferença entre "os testes dizem que funciona" e "o Firestore recusou, e aqui está a mensagem dele".

---

# 4-A. §5.1 — o laço se recupera sozinho do conflito

**Executado UMA única vez**, sem nenhuma tentativa manual adicional. O R2-C provou que o servidor recusa; este passo prova que **o app sabe o que fazer depois da recusa**.

## 4-A.1 Método — e o que foi adaptado

O §5.1 do protocolo manda chamar `sincronizarMutirao()`. Essa função passa por `mutiraoFbRead`/`mutiraoFbWrite`, que **têm a barreira do modo de teste dentro delas** — sob `?teste=1` não iriam à rede, e o teste não provaria nada contra o servidor real.

**Adaptação, autorizada:** trocar **apenas os dois envelopes finos de rede** por versões idênticas às originais menos a barreira (mesma técnica que a bateria N já usa), e então chamar a função **real** `sincronizarMutirao(999)`. O app permaneceu em `?teste=1`: não leu produção sozinho, não migrou, não fez polling, e o armazenamento local ficou nas chaves `teste_*`.

Ficaram sendo exercitados contra o Firestore real: `mutiraoMesclar`, o laço de retentativa, `mutiraoFatiaDoPG`/`mutiraoForaDaFatia` e o contador `mutiraoConflitos` — **todos originais**.

**Como o conflito foi provocado:** só na PRIMEIRA tentativa, o envelope enviou o carimbo `2026-09-09T13:18:28.484138Z`, sabidamente desatualizado. **A recusa veio do servidor real** — o pedido apenas chegou com a versão errada, como aconteceria se outro celular tivesse gravado no meio. Da segunda tentativa em diante, nenhuma interferência.

## 4-A.2 A trilha, operação por operação

| # | Operação | Carimbo enviado | Entregas | Resultado |
|---|---|---|---|---|
| 1 | READ | — | leu 2 | `updateTime 13:21:51.382227Z` |
| 2 | WRITE ⚠️ forçado | `13:18:28.484138Z` **(velho)** | enviou 3 | ❌ `preconditionFailed: true` |
| 3 | READ *(recuperação)* | — | leu 2 | `updateTime 13:21:51.382227Z` |
| 4 | WRITE | `13:21:51.382227Z` **(atual)** | enviou 3 | ✅ `ok: true` → `13:42:00.875275Z` |

**Entre a linha 2 e a linha 4, o laço agiu sozinho:** levou a recusa, releu a nuvem, remesclou e reenviou com o carimbo correto que ele mesmo acabara de buscar. O envelope só interferiu na linha 2 (`forcado: true`); da linha 3 em diante, `forcado: false`. **A recuperação é do código do app, não de intervenção externa.**

## 4-A.3 Resultado

```json
{ "ok": true, "pgNum": 999, "entregas": 3, "enviadas": 1, "tentativa": 2 }
```

| Esperado | Obtido | |
|---|---|---|
| `ok: true` | `true` | ✅ |
| **`tentativa: 2`** | **`2`** | ✅ **é o número que prova a recuperação** |
| `entregas: 3` | `3` | ✅ |
| `enviadas: 1` | `1` | ✅ |
| `mutiraoConflitos` +1 | **0 → 1** | ✅ |

**Convergência, sem perda:** nuvem e aparelho terminaram ambos com `[1, 2, 4]` kg. A entrega de 4 kg que só existia no aparelho subiu; as duas que só existiam na nuvem desceram.

## 4-A.4 `jdpg/grupos` — reconferido

`updateTime` **`2026-09-09T13:02:32.770304Z`** — o mesmo valor de antes, agora 40 minutos anterior à nossa última gravação. Seis campos de topo, `dados` com os mesmos 179.534 bytes. Não foi tocado.

## 4-A.5 Estado da página depois do teste

A página foi **recarregada** logo em seguida, para não deixar envelopes com acesso à rede instalados. Conferido após o recarregamento: os envelopes sumiram, `mutiraoFbWrite` voltou a ter a barreira do modo de teste, `mutiraoConflitos` de volta a `0`.

**Nenhum código funcional foi alterado nesta etapa** — os envelopes viveram só na memória daquela aba, nunca no arquivo.

---

# 5. Estado do documento de teste

`jdpg/mutirao/2026/999` — **3 entregas**, de 1 kg, 2 kg e 4 kg, todas marcadas `R2-TESTE`, `pgNum 999`. `updateTime` `2026-09-09T13:42:00.875275Z`.

**Invisível para o app:** todas as telas filtram por `pgNum`, e não existe PG 999.

**A limpeza será por anulação (tombstone), nunca apagando.** Duas razões: a exclusão do documento é negada pela regra (`allow delete: if false`), e o conjunto de entregas só CRESCE — limpar na nuvem faria qualquer aparelho que ainda as tivesse localmente devolvê-las no próximo sync.

---

# 6. O que ainda NÃO está provado

| | |
|---|---|
| **R2-D** | dois aparelhos físicos simultâneos — e agora eles **precisam estar no MESMO PG**, senão gravam em documentos diferentes e o teste passa sem provar nada. Sinal de validade: `mutiraoConflitos ≥ 1` |
| **R2-E** | persistência ao fechar/reabrir e reentrada |
| **R2 do `AUDIT-17`** | reentrada de convite — independente deste, nunca executado |
| Volume real | o documento de teste tem 3 entregas; o peso de centenas não foi reproduzido |

**A `main` continua intocada em `1aafe63`.** Nenhum aparelho em campo conhece o endereço novo, e o merge exige autorização explícita do usuário.
