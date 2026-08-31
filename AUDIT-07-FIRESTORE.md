# AUDIT-07-FIRESTORE — Da interface ao documento `jdpg/grupos`

**Auditoria:** Falhas de entrada / reentrada no aplicativo
**Fase:** 7 — Camada Firestore: o aceite funciona na tela e falha na persistência?
**Data de execução:** 2026-08-31
**Baseline de código:** `main` @ `1aafe63` — ver [AUDIT-00-SAFETY.md](AUDIT-00-SAFETY.md)
**Baseline de dados:** instantâneo de produção de 31/08/2026 09:51:54Z
**Alterações de código:** **nenhuma** · **Escritas em produção:** **nenhuma**

> **Sobre a exigência de não escrever:** nenhuma requisição de escrita foi emitida nesta fase.
> O corpo do `PATCH` analisado na §3 foi **montado localmente**, a partir do instantâneo já
> capturado, e medido em disco. Nada saiu para a rede. O `updateTime` do documento permanece
> `2026-08-31T09:51:54.856027Z` do início ao fim da auditoria.

---

## Resposta direta

**Sim. O aceite tem uma janela larga para funcionar na tela e falhar na persistência — e a causa
principal é de tamanho, não de lógica.**

Para inscrever uma pessoa num Pequeno Grupo — uma mudança de **819 bytes** — o aplicativo:

1. **baixa 400 KB** (o documento inteiro);
2. **envia 396 KB** (o documento inteiro de volta, com a mudança dentro);
3. repete os dois passos até 4 vezes se houver conflito.

**Um único aceite move até 3,1 MB de rede.** A mudança real é **495 vezes menor** do que o que
trafega para gravá-la.

E, durante todo esse tempo, a interface mostra apenas **"Entrando…"** — sem prazo, sem timeout,
sem barra de progresso e sem qualquer caminho de recuperação se falhar.

---

# 1. O trajeto completo

```
ACEITE  confirmarEntradaConvite  →  botão vira "Entrando…", disabled
   ↓
OBJETO EM MEMÓRIA  aceitarConvite (dentro do laço de 4 tentativas)
   ↓                dados = cópia literal de remote.dados + o participante
PERSISTENCE        commitConviteChange
   ↓                ① GET  (400 KB)  ← a cada tentativa
   ↓                ② monta em memória
   ↓                ③ valida intenção · 6 guardas
FIRESTORE REST     ④ PATCH (396 KB) com updateMask + currentDocument.updateTime
   ↓
DOCUMENTO          jdpg/grupos  ·  campos alterados: dados, ts, convites
```

---

# 2. A requisição, campo a campo

## 2.1 URL

```
https://firestore.googleapis.com/v1/projects/jornada-pequenos-grupos
      /databases/(default)/documents/jdpg/grupos
      ?key=<apiKey pública>
      &updateMask.fieldPaths=dados
      &updateMask.fieldPaths=ts
      &updateMask.fieldPaths=convites
      &currentDocument.updateTime=<updateTime lido no passo ①>
```

| Elemento | Origem | Observação |
|---|---|---|
| `key` | `FB_DEFAULT_CONFIG.apiKey` | Pública por natureza (app estático). Deve estar restrita por referenciador HTTP no Console — **não verificável daqui** |
| `updateMask.fieldPaths` | `fbCamposDeclarados(intencao)` | **3 campos** no aceite |
| `currentDocument.updateTime` | `remote.updateTime` do GET | Trava otimista |

## 2.2 Cabeçalhos e corpo

```
PATCH   Content-Type: application/json
{"fields":{
  "dados":    {"stringValue":"<JSON dos 70 PGs, escapado>"},
  "ts":       {"integerValue":"<Date.now() do APARELHO>"},
  "convites": {"stringValue":"<JSON dos 492 convites, escapado>"}
}}
```

Sem `Authorization`, sem cookie, sem token — **a chave na URL é a única credencial**.

## 2.3 Os campos e o que cada um significa

| Campo | Enviado? | Conteúdo | Quem o produz |
|---|---|---|---|
| `dados` | ✅ | os 70 PGs, cópia literal do remoto + 1 participante | `aceitarConvite` |
| `convites` | ✅ | os 492 convites, com 1 marcado `utilizado` | `mergeConvites` + `podarConvites` |
| `ts` | ✅ | relógio **do aparelho** | `fbWriteGrupos` |
| `tutores` | ❌ | — | deliberadamente fora (já foi zerado 2×) |
| `setoresMestre` / `setoresEfetivo` | ❌ | — | não declarados no aceite |
| `embaixadoresExternos` | ❌ | — | idem |
| `schemaVersion` / `writeNonce` | ❌ | — | flag desligada |

**Os campos não declarados ficam intactos na nuvem** — é exatamente o que a máscara garante (§4).

---

# 3. Tamanho — o achado central desta fase

Corpo do `PATCH` de um aceite, montado localmente a partir do instantâneo:

| Componente | Bytes |
|---|---|
| `dados` (escapado) | 183 358 |
| `convites` (escapado) | **221 801** |
| `ts` + estrutura | ~100 |
| **Total do corpo** | **405 262 bytes = 396 KB** |

## 3.1 Custo de rede de um único aceite

| | Baixa | Sobe | Total |
|---|---|---|---|
| 1 tentativa | 400 KB | 396 KB | **795 KB** |
| 4 tentativas (teto) | 1 600 KB | 1 584 KB | **3 181 KB ≈ 3,1 MB** |

## 3.2 A desproporção

| O que muda de fato | Bytes |
|---|---|
| 1 participante novo | ~469 |
| 1 convite marcado como utilizado | ~350 |
| **Mudança real** | **~819** |
| **Enviado para gravá-la** | **405 262** |
| **Amplificação** | **≈ 495×** |

> ### 🔴 F-64 — Cada aceite envia 396 KB para gravar 819 bytes
>
> O modelo de escrita é "minha lista inteira substitui a da nuvem" — dívida já reconhecida no
> `ARQ-004`. Aqui está o preço dela, medido, no fluxo de entrada:
>
> - **396 KB de upload** num celular, em rede hospitalar, é uma operação de dezenas de segundos.
>   Upload é tipicamente muito mais lento que download em rede móvel.
> - Não há `AbortController`, não há `signal`, **não há timeout em nenhuma das duas requisições**
>   (verificado: zero ocorrências no arquivo). A requisição fica pendurada no limite do navegador.
> - Durante toda a espera, a tela mostra `Entrando…` com o botão desabilitado. **Sem prazo, sem
>   progresso, sem cancelar.**
> - Se a conexão cair no meio, o `fetch` lança, a rota devolve `sem_conexao` e **nada é
>   remarcado** (F-60). A pessoa recomeça do zero — e o link já sumiu da URL (F-10).
>
> **Esta é a explicação mais provável para "o aceite funciona na interface e falha na
> persistência".** A interface faz a parte dela em milissegundos; a persistência tenta subir
> quase 400 KB.

## 3.3 O agravante: o campo que mais pesa é o que nunca é limpo

**`convites` responde por 221 801 dos 405 262 bytes — 55% do corpo do `PATCH`.**

Ele contém 492 convites, dos quais **90 estão pendentes e 34 já venceram**. Como
`expirarConvitesVencidos()` nunca é chamada (F-30) e `podarConvites` só poda estados terminais,
**convite pendente nunca sai do documento**.

Consequência encadeada: **cada convite pendente que se acumula torna todos os aceites futuros
mais lentos e mais frágeis.** O registro de convites, que deveria ser um detalhe administrativo,
é hoje a maior parte do peso de toda entrada no sistema.

## 3.4 O custo do polling

`startFbPoll` (`index.html:11486`) faz `syncFromFirebase()` a cada **30 segundos**, e cada
sincronização é um GET de **400 KB**. Um aparelho com o app aberto baixa **~48 MB por hora**.
Cada retorno de visibilidade (reabrir o app) dispara mais um GET completo.

Não é causa de falha do aceite, mas é o mesmo defeito estrutural, e consome a franquia de rede das
pessoas.

---

# 4. Merge ou substituição?

**Substituição do campo, preservação do documento.** Os dois níveis funcionam:

| Nível | Comportamento | Mecanismo |
|---|---|---|
| Documento | ✅ **preservado** — campos fora da máscara ficam intactos | `updateMask.fieldPaths` |
| Campo `dados` | ⚠️ **substituído por inteiro** | é uma string única |
| Campo `convites` | ⚠️ **substituído por inteiro** | idem |

Não existe merge no servidor. O merge acontece **no cliente**, antes de enviar:

- `dados` — cópia literal do remoto recém-lido, mais o participante. **Não há merge com o estado
  local**; a base é sempre o remoto.
- `convites` — `mergeConvites(remote.convites, loadConvites())`, com a máquina de estados
  garantindo que um estado terminal não regride.

A ausência de `updateMask` é o defeito que já zerou `tutores` duas vezes (10/07 e 13/07). **A
máscara está presente e correta em todas as rotas.**

---

# 5. Tratamento de erro — a matriz completa

O código que decide tudo são cinco linhas (`index.html:11103-11109`):

```js
if (r.status === 400) {
  const t = await r.text();
  if (t.indexOf('FAILED_PRECONDITION') >= 0) return { ok:false, preconditionFailed:true };
  throw new Error('HTTP 400: ' + t.slice(0,120));
}
if (!r.ok) { const t = await r.text(); throw new Error('HTTP ' + r.status + ': ' + t.slice(0,120)); }
```

## 5.1 Matriz de respostas

| HTTP | Causa real | Classificação no app | Repete? | Mensagem à pessoa |
|---|---|---|---|---|
| **200** | sucesso | `ok` | — | entra |
| **400** + `FAILED_PRECONDITION` | outro aparelho gravou antes | `preconditionFailed` | ✅ **sim, até 4×** | — |
| **400** outro | corpo malformado, máscara inválida | exceção → `sem_conexao` | ❌ | "Sem conexão. Verifique sua internet" |
| **401** | chave inválida ou revogada | exceção → `sem_conexao` | ❌ | idem |
| **403** | **regra do Firestore recusou** | exceção → `sem_conexao` | ❌ | idem |
| **404** | documento não existe | exceção → `sem_conexao` | ❌ | idem |
| **429** | cota estourada | exceção → `sem_conexao` | ❌ **não** | idem |
| **500 / 502 / 503 / 504** | falha do servidor Google | exceção → `sem_conexao` | ❌ **não** | idem |
| rede caiu / offline | `fetch` lança `TypeError` | exceção → `sem_conexao` | ❌ | idem |
| sem resposta (pendura) | sem timeout | **nunca resolve** | — | **"Entrando…" para sempre** |

## 5.2 Tratamento de 4xx

**Só um dos 4xx é reconhecido.** O `400` com `FAILED_PRECONDITION` tem tratamento próprio e
correto. Todos os outros — inclusive os que significam coisas opostas — caem no mesmo balde.

> ### 🔴 F-48 (confirmado com a matriz) — 403 vira "Sem conexão"
>
> Um `403` significa **"a regra do Firestore recusou esta gravação"** — condição **permanente**,
> que não melhora esperando e não melhora trocando de rede. A pessoa lê *"Verifique sua internet
> e abra o link novamente"* e vai tentar de novo, indefinidamente, num erro que nunca vai passar.
>
> Este é o defeito que já custou duas incidências conhecidas ao projeto (campo `convites` em
> 08/07, `setoresMestre` na RC4.8) e é o motivo explícito de `FB_FLAGS.schemaVersionWrite` nascer
> desligada. **O tratamento continua igual.**
>
> O texto do erro é capturado (`t.slice(0,120)`) e vai para `detalhe` — mas `detalhe` **não é
> exibido em lugar nenhum** na rota de aceite. A informação que distinguiria as causas é colhida
> e descartada.

## 5.3 Tratamento de 5xx

> ### 🔴 F-65 — Erro transitório do servidor é tratado como permanente
>
> Um `503 Service Unavailable` é a situação clássica de "tente de novo em um segundo". No
> aplicativo:
>
> ```js
> try { w = await fbWriteGrupos(cfg, {...}); }
> catch (e) { return { ok:false, motivo:'sem_conexao', detalhe:… }; }   // ← RETURN, não CONTINUE
> ```
>
> O `catch` está **dentro** do laço de 4 tentativas, mas faz `return` — **abandona o laço na
> hora**. Um único 5xx, um 429 ou uma oscilação de rede encerra o aceite inteiro na primeira
> tentativa.
>
> As 4 tentativas existem **exclusivamente** para conflito de concorrência. Para **todo o resto**,
> o aplicativo tenta uma vez só.
>
> A rota dos grupos tem a mesma estrutura, mas ao menos marca pendência e reenvia ao reconectar.
> **A rota do aceite não faz nem uma coisa nem outra.**

## 5.4 Comportamento offline

| Momento | O que acontece |
|---|---|
| Offline ao abrir o link | `fbReadDoc` lança → `syncFromFirebase` engole → cache local vazio → **"Convite indisponível"** (F-01) |
| Offline ao tocar "Entrar" | `fetch` lança → `sem_conexao` → mensagem correta ✅ |
| Cai no meio do upload | `fetch` lança → `sem_conexao` → **nada foi aplicado localmente** (correto) e **nada foi remarcado** (F-60) |
| Volta a conexão | `fbRetryOnReconnect` roda… e chama **`saveGruposToFirebase()`** — a rota dos **grupos** |

> ### 🔴 F-66 — Não existe recuperação automática para um aceite que falhou
>
> `fbRetryOnReconnect` (`index.html:10705`) tem duas travas — `FB_FLAGS.retryOnReconnect` e
> `fbPendingSync` — e a rota do convite **nunca liga a segunda**. Mesmo se ligasse, a função
> chama `saveGruposToFirebase()`, que **regrava o estado local** — e o estado local **não contém**
> o aceite, porque `aplicarLocal()` só roda depois do `ok`.
>
> **Um aceite que falhou por rede está perdido de forma definitiva.** Não há fila, não há
> pendência, não há reenvio. A pessoa precisa abrir o link outra vez — que já foi apagado da URL
> (F-10) e só existe na mensagem do WhatsApp.
>
> Este é o desenho **correto quanto à integridade** (nada pela metade) e **incompleto quanto à
> continuidade** (nada é retomado).

---

# 6. Concorrência e versão do documento

## 6.1 A trava otimista funciona

```js
url += '&currentDocument.updateTime=' + encodeURIComponent(intencao.baseUpdateTime);
```

`updateTime` é o carimbo **do servidor**, lido no GET da mesma volta do laço. Se qualquer aparelho
gravar entre o GET e o PATCH, o Firestore devolve `FAILED_PRECONDITION` e a volta seguinte relê
tudo do zero.

Três propriedades corretas, que vale registrar:

- **Snapshot sempre fresco:** cada tentativa refaz o GET. Nenhuma retentativa reaproveita um
  retrato velho.
- **Espera aleatória** (`80 + Math.random()*120` ms) — quebra o lock-step entre dois aparelhos.
- **Estado local intocado** até o `ok` do servidor.

**Não encontrei nenhuma falha no controle de concorrência do aceite.**

## 6.2 Três marcadores de versão, só um verdadeiro

| Marcador | Origem | Usado para | Confiável? |
|---|---|---|---|
| `updateTime` | **servidor** | pré-condição | ✅ **é a verdade** |
| `ts` | **relógio do aparelho** | heurística de merge em `prepareSaveGrupos` | ⚠️ relógio errado corrompe |
| `schemaVersion` | não gravado (flag off) | guarda G6 | ❌ sempre ausente → `fbSchemaRemoto` = 1 |

**F-67** — `ts` é enviado em toda gravação com `Date.now()` do aparelho. Um celular com data
errada grava um `ts` fora de ordem, e `prepareSaveGrupos` (`remote.ts !== fbLastKnownTs`) decide
fazer merge com base nele. O aceite não usa essa heurística — usa só `updateTime` —, mas a rota
dos grupos usa, **e as duas escrevem no mesmo campo**.

## 6.3 Possibilidade de overwrite

| Cenário | Possível? | Por quê |
|---|---|---|
| O aceite sobrescreve mudança concorrente **na nuvem** | ❌ **Não** | pré-condição + releitura por tentativa |
| O aceite apaga campos não declarados | ❌ **Não** | `updateMask` |
| O aceite apaga PGs que este app não conhece | ❌ **Não** | copia `remote.dados` literalmente |
| O aceite apaga um participante | ❌ **Não** | só acrescenta ao array do remoto |
| **O aceite destrói alteração local pendente** | ✅ **SIM** | `aplicarLocal` → `applyGruposData(dados)` reescreve `GRUPOS_KEY` com o payload derivado do **remoto** (F-60) |

**O único overwrite real do aceite é contra o próprio aparelho, não contra a nuvem.** A proteção
que existe na rota dos grupos (`fbPendingSync ? mergeGruposData(...) : result.dados`,
`index.html:11285`) nunca foi estendida ao aceite.

---

# 7. Onde exatamente o aceite pode "funcionar na tela e falhar na base"

Em ordem de probabilidade, para uma pessoa em rede hospitalar:

| # | Ponto de falha | O que ela vê | Ficou gravado? |
|---|---|---|---|
| 1 | **Upload de 396 KB não completa** | "Entrando…" por muito tempo, depois "Sem conexão" | ❌ nada, e nada será retomado |
| 2 | **Requisição pendura sem timeout** | **"Entrando…" para sempre** | ❌ nada; ela fecha o app |
| 3 | 403 da regra do Firestore | "Sem conexão" (falso) | ❌ nunca vai gravar |
| 4 | 5xx / 429 transitório | "Sem conexão" | ❌ não tenta de novo |
| 5 | 4 conflitos seguidos | "Convite indisponível" (falso) | ❌ nada |
| 6 | Guarda de conteúdo dispara | "Entrada bloqueada por segurança" ✅ honesta | ❌ nada — correto |
| 7 | **Gravou, mas com tombstone** | tela de boas-vindas ✅ | ⚠️ **gravou e a pessoa some da lista** (F-37) |

**As linhas 1 a 5 são "funciona na tela, falha na base".** A linha 7 é o inverso e mais cruel:
**gravou de verdade, e mesmo assim a pessoa não aparece.**

Nenhuma das sete deixa rastro em telemetria (F-59). É por isso que a frequência real é
desconhecida.

---

# 8. Achados novos da Fase 7

| # | Achado | Sev. |
|---|---|---|
| **F-64** | Cada aceite envia 396 KB para gravar 819 bytes (495×); até 3,1 MB com retentativas; **sem timeout em nenhuma requisição** | **A** |
| **F-65** | 5xx, 429 e queda de rede fazem `return` e **abandonam o laço na primeira tentativa** — as 4 tentativas servem só para conflito | **A** |
| **F-66** | Aceite que falhou por rede **não é retomado nunca**: sem pendência, e o retry ao reconectar chama a outra rota | **A** |
| **F-67** | `ts` vem do relógio do aparelho e alimenta a heurística de merge da rota dos grupos | B |
| **F-68** | O texto do erro HTTP é capturado em `detalhe` e **nunca exibido** na rota de aceite — a informação que separaria as causas é colhida e descartada | B |
| **F-69** | Polling de 30 s baixa 400 KB por vez: ~48 MB/hora por aparelho com o app aberto | B |

Confirmados com evidência nova: **F-48** (403 → "Sem conexão"), **F-60** (aceite destrói pendência
local), **F-30** (convites pendentes nunca podados encarecem todo aceite futuro).

---

# 9. O que está certo nesta camada

Vale registrar, porque é bastante:

| | |
|---|---|
| ✅ | `updateMask` presente e correta — nenhum campo omitido é apagado |
| ✅ | Pré-condição por `updateTime` do servidor — sem overwrite de escrita concorrente |
| ✅ | Releitura do remoto a cada tentativa — nunca reaproveita retrato velho |
| ✅ | Espera aleatória entre tentativas — evita lock-step |
| ✅ | Estado local só é alterado depois do `ok` — nunca fica pela metade |
| ✅ | `dados` copiado literalmente — imune à perda de campos das outras rotas |
| ✅ | Guarda de tamanho de `dados` antes de gastar a rede |
| ✅ | Conflito tratado como resultado normal, não como erro |

**O controle de concorrência do aceite não tem defeito.** Os problemas desta camada são de
**volume**, de **classificação de erro** e de **continuidade** — não de correção.

---

# 10. Limites desta fase

- **Nenhuma escrita foi emitida.** O corpo do `PATCH` foi montado localmente a partir do
  instantâneo e medido em disco. O `updateTime` do documento não mudou durante toda a auditoria.
- **Nenhuma resposta HTTP foi observada de verdade.** A matriz da §5 é derivada do código, não de
  respostas reais do Firestore. Provocar um 403 ou um 429 exigiria escrever em produção.
- **Os tamanhos são do instantâneo de 31/08.** Crescem com o número de participantes e,
  sobretudo, com o acúmulo de convites pendentes.
- **A restrição da chave de API por referenciador HTTP não foi verificada** — só o Console
  responde isso.
- **Não foi medido tempo real de upload.** A conclusão de que 396 KB é lento em rede hospitalar é
  inferência, não medição — mas a inferência não depende de qual seja a velocidade exata.
- **Nada disto explica um aceite que grava e some da lista** (linha 7 da §7): esse é o F-37, da
  camada de dados, não desta.
