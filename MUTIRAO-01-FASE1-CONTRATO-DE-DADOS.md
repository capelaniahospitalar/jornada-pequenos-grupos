# MUTIRÃO DE NATAL 2026 · FASE 1 — Contrato de dados

**Data:** 2026-09-08 · **Base:** `1.3.0-rc1` @ `6a7aee8` · **Status:** 📐 proposta, nada implementado
**Nenhuma linha do app foi modificada.**

---

# 1. Fatos medidos antes de desenhar

*Tudo abaixo foi verificado, não presumido. Fontes: código da base e dois retratos reais da produção (28/08 e 04/09), lidos sem escrita.*

## 1.1 `updateMask` protege campos de topo

`fbCamposDeclarados()` (linha ~11700) monta a máscara **apenas com os campos presentes na intenção**. O PATCH só altera o que está na máscara.

**Consequência:** um campo de topo que o app publicado (`1.2.0-rc1`) não conhece **não entra na máscara dele e portanto não é apagado** por ele.

**Evidência empírica:** os dois retratos, separados por 7 dias de uso intenso do app publicado, têm exatamente os mesmos 6 campos de topo:

```
ts · dados · tutores · convites · setoresEfetivo · setoresMestre
```

`setoresMestre` e `setoresEfetivo` nasceram depois de `dados`/`tutores` e **sobreviveram**. Isto é evidência forte — não é prova formal, mas é o melhor que se pode obter sem instrumentar a produção.

> ⚠️ **O contraste importa:** um campo colocado **dentro** de `dados` (por exemplo `g.mutirao`) teria destino oposto. O app publicado reescreve `dados` inteiro a partir da memória dele, e **descartaria** o campo que não conhece. Foi exatamente assim que `pgProgress` e o `pgId` do PG 32 se perderam. **Os registros do Mutirão não podem viver dentro de `dados`.**

## 1.2 🔴 `pgId` está vazio em 66 dos 70 PGs

Contagem no retrato de 04/09:

| | |
|---|---|
| Slots totais | **70** |
| `pgId: null` | **66** |
| `pgId` com valor real | **4** |

O código explica: `pgId` só é gerado para PG **novo**, em `criarPgNoProximoSlot()` (linha 9390). Os PGs anteriores dependem da migração **M3**, que nunca foi executada. O próprio comentário do código diz que nada depende de `pgId` nesta versão.

**Consequência para o contrato:** se `pgId` for a chave do PG na entrega, **66 dos 70 PGs gravariam entregas com chave `null`** — todas indistinguíveis entre si. Isso inviabiliza qualquer relatório por PG.

**Decisão proposta:** manter `pgId` no registro, como você pediu, mas **como retrato, não como chave**. A chave operacional é `pgNum` (o número do slot, 1–70), que está presente em 100% dos casos e é estável — a regra do projeto é nunca mover PG de slot.

## 1.3 Orçamento de tamanho do documento

| | |
|---|---|
| Limite do Firestore por documento | **1 MiB** |
| `jdpg/grupos` hoje (representação da API) | ~435 KB |
| Guarda interna do app sobre `dados` | aborta acima de 480 KB |
| Tamanho estimado de 1 registro de entrega | ~350 bytes crus, ~500 bytes já escapados dentro de um `stringValue` |

**1 000 entregas ≈ 500 KB.** Somado ao documento atual, isso encosta no teto de 1 MiB.

---

# 2. Onde os registros devem viver — a decisão estrutural

## Opção 1 — campo de topo `mutirao` dentro de `jdpg/grupos`

| ✅ A favor | ❌ Contra |
|---|---|
| Reaproveita todo o contrato de escrita já endurecido (guardas G1–G6, trava otimista, `writeNonce`) | **Divide o teto de 1 MiB** com um documento que já tem ~435 KB |
| Protegido do app publicado pelo `updateMask` (§1.1) | Cada entrega **disputa gravação** com a sincronização dos grupos → mais conflitos e retentativas |
| Menos código novo | A campanha fica presa ao documento principal; arquivá-la depois exige mexer nele |

## ⭐ Opção 2 — documento próprio `jdpg/mutirao` (RECOMENDADA)

| ✅ A favor | ❌ Contra |
|---|---|
| **Orçamento próprio de 1 MiB** — não rouba espaço dos grupos | Exige caminho novo de leitura/escrita |
| **Zero disputa** com a sincronização dos grupos | Exige regra nova no Firestore |
| **Invisível para o app publicado** — ele nunca toca nesse documento, nem por acidente | Precisa **reimplementar a trava otimista** (`currentDocument.updateTime`), senão perde a proteção contra gravação concorrente |
| A campanha tem ciclo de vida próprio: pode ser arquivada sem encostar nos grupos | |

**Recomendo a Opção 2.** O motivo decisivo é o §1.3: a Opção 1 tem um teto que o mutirão pode encostar, e encostar no teto neste app significa gravação recusada — o modo de falha mais caro que já tivemos.

⚠️ **Condição inegociável da Opção 2:** o documento novo tem de usar a **mesma trava otimista** do documento de grupos (pré-condição `currentDocument.updateTime` + releitura em caso de recusa). Sem isso, duas pessoas registrando ao mesmo tempo perdem uma das entregas — o *lost update* clássico.

---

# 3. O registro de entrega

## 3.1 Formato

```json
{
  "entregaId":    "8f2c1a90-7b34-4e51-9d02-6a1f8c3e5b47",
  "mutiraoNatal": "2026",
  "pgNum":        12,
  "pgId":         null,
  "tipoOrigem":   "PARTICIPANTE_PG",
  "quantidadeKg": 10,
  "data":         "2026-12-05",
  "ts":           1788536399786,
  "registradoPor": { "memberId": "cd91b14b-…", "nome": "Maria da Silva", "papel": "participante" },
  "participante":  { "memberId": "cd91b14b-…", "nome": "Maria da Silva" },
  "externo":       null,
  "removed":       false
}
```

## 3.2 Campo a campo

| Campo | Tipo | Obrigatório | O que é |
|---|---|---|---|
| `entregaId` | UUID | ✅ | **Identificador único da entrega.** Gerado no aparelho, por `uuid()`. É a chave primária |
| `mutiraoNatal` | string | ✅ | **Edição da campanha** — `"2026"`. Permite uma edição futura sem misturar os dados *(interpretação minha — confirmar, §7)* |
| `pgNum` | inteiro 1–70 | ✅ | **Chave operacional do PG.** Sempre presente |
| `pgId` | UUID ou `null` | ✅ (pode ser `null`) | Retrato da identidade estável do PG **no momento do registro**. Hoje `null` em 66 de 70 (§1.2). Nunca usado como chave |
| `tipoOrigem` | `"PARTICIPANTE_PG"` \| `"EXTERNO"` | ✅ | **O discriminador.** Ver §4 |
| `quantidadeKg` | número > 0 | ✅ | Quilos entregues |
| `data` | `"AAAA-MM-DD"` | ✅ | **Dia da entrega** — pode ser anterior ao dia em que foi digitada |
| `ts` | inteiro (epoch ms) | ✅ | **Momento do registro.** Diferente de `data`. Serve para ordenar, auditar e resolver empate |
| `registradoPor` | objeto | ✅ | Quem digitou: `memberId`, `nome`, `papel` no momento |
| `participante` | objeto ou `null` | condicional | Preenchido **só** no TIPO 1 |
| `externo` | objeto ou `null` | condicional | Preenchido **só** no TIPO 2 |
| `removed` | booleano | ✅ | **Tombstone.** Ver §6 |

### `participante` (TIPO 1)
```json
{ "memberId": "cd91b14b-…", "nome": "Maria da Silva" }
```

### `externo` (TIPO 2)
```json
{ "nome": "João Pereira", "setor": "Farmácia" }
```
> `setor` é texto livre digitado pelo coordenador — **não normalizar**, mesma regra já adotada para os Embaixadores externos.

## 3.3 Princípio: o registro é um fato histórico, congelado

Os nomes são gravados **como estavam no momento da entrega** e **nunca são re-resolvidos** depois.

**Por quê:** este app reconcilia identidade (um participante que reentra pode ganhar `memberId` novo; nomes são corrigidos; pessoas trocam de PG). Se o relatório do mutirão fosse recalculado a partir do cadastro atual, uma correção de cadastro em janeiro **reescreveria a história de dezembro**. O registro guarda o `memberId` para permitir cruzamento, mas o `nome` gravado é a verdade daquele dia.

---

# 4. Os dois tipos, e a regra que os separa

| | TIPO 1 | TIPO 2 |
|---|---|---|
| `tipoOrigem` | `"PARTICIPANTE_PG"` | `"EXTERNO"` |
| Quem é o doador | participante inscrito no PG | colaborador que **não** pertence ao PG |
| Quem registra | o próprio participante | o **Coordenador** do PG |
| `participante` | objeto preenchido | **obrigatoriamente `null`** |
| `externo` | **obrigatoriamente `null`** | objeto preenchido |

## 4.1 Invariante de exclusividade mútua

> **Todo registro tem exatamente uma identidade de doador preenchida — nunca duas, nunca nenhuma.**

```
tipoOrigem === "PARTICIPANTE_PG"  →  participante ≠ null  E  externo === null
tipoOrigem === "EXTERNO"          →  externo ≠ null       E  participante === null
```

Qualquer outra combinação é **registro inválido** e deve ser **recusado alto**, na hora, antes de gravar — no mesmo espírito de `validarIntencao()`, que recusa chave fora do contrato em vez de gravar `undefined` em silêncio.

As quatro combinações possíveis:

| `participante` | `externo` | Veredito |
|---|---|---|
| preenchido | `null` | ✅ válido se `tipoOrigem = PARTICIPANTE_PG` |
| `null` | preenchido | ✅ válido se `tipoOrigem = EXTERNO` |
| preenchido | preenchido | ❌ **recusar** — ambiguidade |
| `null` | `null` | ❌ **recusar** — entrega sem doador |

Mais duas recusas: `tipoOrigem` fora dos dois valores literais, e o par identidade↔tipo trocado (participante preenchido com `tipoOrigem = EXTERNO`).

---

# 5. ✅ Critério de aceite — a demonstração

> *"Conseguir demonstrar no banco que uma entrega de 10 kg feita por um participante é diferente de uma entrega de 10 kg feita por um colaborador externo."*

Duas entregas, ambas de **10 kg**, ambas no **PG 12**, no **mesmo dia**:

**Entrega A — participante do PG**
```json
{
  "entregaId": "8f2c1a90-7b34-4e51-9d02-6a1f8c3e5b47",
  "mutiraoNatal": "2026", "pgNum": 12, "pgId": null,
  "tipoOrigem": "PARTICIPANTE_PG",
  "quantidadeKg": 10, "data": "2026-12-05", "ts": 1796470800000,
  "registradoPor": { "memberId": "cd91b14b-…", "nome": "Maria da Silva", "papel": "participante" },
  "participante":  { "memberId": "cd91b14b-…", "nome": "Maria da Silva" },
  "externo": null, "removed": false
}
```

**Entrega B — colaborador externo**
```json
{
  "entregaId": "b0d4e7f2-19ac-4a63-8e11-2c7d95f04a38",
  "mutiraoNatal": "2026", "pgNum": 12, "pgId": null,
  "tipoOrigem": "EXTERNO",
  "quantidadeKg": 10, "data": "2026-12-05", "ts": 1796470920000,
  "registradoPor": { "memberId": "7de7a9c5-…", "nome": "Ana Beatriz", "papel": "coordenador" },
  "participante": null,
  "externo": { "nome": "João Pereira", "setor": "Farmácia" },
  "removed": false
}
```

**Elas se distinguem por quatro marcas independentes**, e basta uma para separá-las:

| Marca | A | B |
|---|---|---|
| `tipoOrigem` | `PARTICIPANTE_PG` | `EXTERNO` |
| `participante` | preenchido | `null` |
| `externo` | `null` | preenchido |
| `registradoPor.papel` | `participante` | `coordenador` |

**Redundância proposital.** Um único discriminador que se corrompa deixaria o dado ambíguo; com quatro marcas correlacionadas, qualquer inconsistência é **detectável** por auditoria — e não silenciosa.

**Contagem separada, sem ambiguidade:**
```
kg de participantes = soma(quantidadeKg) onde tipoOrigem = "PARTICIPANTE_PG" e removed = false
kg de externos      = soma(quantidadeKg) onde tipoOrigem = "EXTERNO"        e removed = false
```

---

# 6. Correção de erro — tombstone, nunca apagar

Convenção já estabelecida neste app (participantes usam `removed`).

- **Errou a quantidade?** Marca `removed: true` no registro errado e cria um novo. Os dois ficam no banco.
- **Todo relatório filtra `removed === false`.** *(A lição de 21/08: contar sem filtrar tombstone infla os totais.)*
- **Nada é apagado de verdade** — a trilha de auditoria sobrevive, e uma exclusão acidental é reversível.

Campos adicionais no registro anulado: `removedAt` (epoch ms) e `removedBy` (`memberId` + nome).

---

# 7. ⛔ Ainda preciso de você

## 7.1 Confirmações sobre este contrato

1. **`mutiraoNatal = "2026"`** — interpretei como a *edição* da campanha, para não misturar com um mutirão de 2027. Está certo?
2. **`quantidadeKg` aceita decimal?** (ex.: 2,5 kg) Se sim, quantas casas? E existe um máximo plausível por entrega, para barrar erro de digitação (alguém digitar 1000 em vez de 10)?
3. **O que é "kg"** — alimento não perecível em quilos? Ou o mutirão também recebe outras coisas (brinquedo, roupa, dinheiro) que precisariam de unidade diferente?
4. **Um externo pode entregar mais de uma vez?** Se sim, ele é identificado só pelo nome digitado — dois "João Pereira" de setores diferentes viram pessoas diferentes. Aceitável?

## 7.2 Decisões que continuam abertas desde a FASE 0

5. **A escolha A / B / C** sobre o card do grupo (flâmula + dados + acesso à inscrição) que hoje mora dentro da seção Progresso.
6. **Quem pode registrar** — confirmado: participante registra a própria; coordenador registra externo. **O tutor pode registrar?** E o coordenador pode registrar pelo participante que não tem celular?
7. **Meta** — existe? Por PG, por setor, geral?
8. **Prazo** — data de início e de encerramento do mutirão.
9. **Cor laranja escuro** — há referência visual, ou fica a meu critério?
10. **Estrutura:** Opção 1 ou **Opção 2 (recomendada)** do §2.

---

# 8. O que a implementação exigirá (para dimensionar, não para fazer agora)

| # | Mudança | Onde |
|---|---|---|
| 1 | Constantes do documento novo | junto de `FB_COLL`/`FB_DOC` |
| 2 | Leitura + escrita com trava otimista | caminho novo, espelhando `fbReadDoc`/`fbWriteGrupos` |
| 3 | **Regra do Firestore para `jdpg/mutirao`** | Console — **sem isso é 403 mascarado de "sem conexão"** |
| 4 | Validador do invariante do §4.1 | recusa alta, antes de gravar |
| 5 | Botão laranja + tela de registro | Home, no lugar da âncora `#grupos-home-btn` |
| 6 | Constante `MOSTRAR_PROGRESSO_PG_HOME = false` | linha 6941 |
| 7 | Testes de bancada do invariante | junto da suíte existente |

> ⚠️ **Lembrete do item 3:** a regra do Firestore é o erro mais recorrente deste projeto. Campo/documento novo sem regra publicada = gravação recusada que aparece ao usuário como "sem conexão".

---

# 9. Situação

| | |
|---|---|
| FASE 0 | ✅ concluída |
| FASE 1 | 📐 contrato proposto — **aguardando as 10 respostas do §7** |
| Código modificado | **nenhum** |
| `main` | 🔒 intocada em `1aafe63` |
| Produção | 🔒 nenhuma escrita — os dois retratos foram lidos de backups locais |
