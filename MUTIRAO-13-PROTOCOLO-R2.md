# MUTIRÃO DE NATAL 2026 · PROTOCOLO R2 — validação contra o Firestore real

**Data:** 2026-09-08 · **Versão candidata:** `1.3.0-rc1` + Mutirão (FASES 0–12)
**Status:** 📋 **PROTOCOLO — não executado.** Exige a regra publicada e, na etapa D, dois aparelhos.

> **O que este protocolo prova, e os 227 testes não provam:** que a URL real está certa, que a
> regra publicada aceita a gravação, e que **o Firestore de verdade honra a pré-condição**.
> Até aqui, a trava foi provada contra um servidor falso escrito por mim.

---

# 0. A sequência acordada

```
Regra local aprovada ✅
   ↓
1. Publicar a regra no Console          ← você
   ↓
2. R2-A  gravação real controlada       ← 1 aparelho, 5 min
   ↓
3. R2-B  conferir no Console do Firestore
   ↓
4. R2-C  ⭐ pré-condição de concorrência ← 1 aparelho, prova a trava
   ↓
5. R2-D  ⭐ simultaneidade                ← 2 aparelhos
   ↓
6. R2-E  persistência e reentrada
   ↓
Fechar T9 → Homologar
```

**R2-C é a etapa mais valiosa e precisa de uma pessoa só.** Ela transforma a trava de promessa de código em propriedade comprovada — sem depender de agenda de duas pessoas.

---

# 1. Por que este R2 pode rodar em PRODUÇÃO

O R2 da reentrada de convite (`AUDIT-17`) exigiu um projeto Firebase separado, porque mexia em `jdpg/grupos`, onde vivem os dados reais de 70 PGs. **Aqui é diferente:**

| | |
|---|---|
| `jdpg/mutirao` | documento **novo**, ainda não existe. Nada depende dele |
| `jdpg/grupos` | **nenhum caminho de código do Mutirão o toca** |
| Exclusão do documento | **negada pela regra** — não há como destruí-lo |
| Pior caso | entregas de teste ficam registradas na campanha — e §7 resolve |

E há uma razão positiva: **testar num projeto de teste não validaria a regra publicada em produção**, que é justamente o que precisamos provar.

## 1.1 ⚠️ A única armadilha: a mesclagem só CRESCE

O conjunto de entregas nunca encolhe — foi assim que garantimos que nada se perde. **O efeito colateral é que apagar não funciona como se espera:**

> Se você limpar as entregas de teste **só na nuvem**, o próximo sync de qualquer aparelho que ainda as tenha no armazenamento local **traz todas de volta**.

A forma correta de remover é **anular** (tombstone), que o merge propaga corretamente. Ver §7.

---

# 2. Preparação

**No Console do Firebase** — projeto `jornada-pequenos-grupos`, conta Google **"OQQÉ? Tutorial"** (não a "Wladimir"):

1. Firestore Database → aba **Regras** → colar o texto de `firestore.rules` → **Publicar**.
2. Anotar o horário da publicação.

**No aparelho** (versão candidata servida localmente ou publicada — **sem** `?teste=1`, porque o modo de teste barra a rede de propósito):

3. Abrir o app, F12 → Console.
4. Confirmar a URL real:

```
mutiraoDocUrl(loadFbConfig())
```

Esperado: `.../projects/jornada-pequenos-grupos/databases/(default)/documents/jdpg/mutirao?key=…`

⚠️ **Conferir três vezes que o `projectId` é `jornada-pequenos-grupos`** e que o caminho termina em `jdpg/mutirao`.

---

# 3. R2-A — Gravação real controlada

**Objetivo:** provar que a regra publicada aceita a gravação e que o documento nasce.

As entregas de teste usam **`pgNum: 999`**, que não corresponde a nenhum PG real — assim elas ficam **invisíveis em todas as telas** (todas filtram por `pgNum`) e são triviais de identificar depois.

```
const cfg = loadFbConfig();

// 1. Estado atual (o documento provavelmente ainda não existe)
const antes = await mutiraoFbRead(cfg);
console.log('ANTES:', antes);

// 2. Uma entrega de teste, marcada
const teste = (kg) => ({
  entregaId: crypto.randomUUID(), mutiraoNatal: '2026', pgNum: 999, pgId: null,
  tipoOrigem: 'PARTICIPANTE_PG', quantidadeKg: kg, data: '2026-09-08', ts: Date.now(),
  registradoPor: { memberId: 'R2-TESTE', nome: 'R2 TESTE', papel: 'colaborador' },
  participante:  { memberId: 'R2-TESTE', nome: 'R2 TESTE' },
  externo: null, removed: false
});

// 3. Grava
const w = await mutiraoFbWrite(cfg, (antes.entregas || []).concat([teste(1)]), antes.updateTime);
console.log('GRAVACAO:', w);
```

| Esperado | |
|---|---|
| `w.ok === true` | ✅ a regra aceitou |
| `w.updateTime` | um carimbo novo |

| Se falhar | O que significa |
|---|---|
| `http: 403` · `sem_permissao` | **a regra não está publicada** (ou tem erro de sintaxe) |
| `preconditionFailed: true` | outro aparelho gravou no meio — repita |
| `http: 400` | a forma do documento não bate com a regra |

---

# 4. R2-B — Conferir no Firestore real

```
const depois = await mutiraoFbRead(cfg);
console.log('DEPOIS:', depois.entregas.length, depois.updateTime);
```

**E no Console do Firebase:** Firestore Database → **Dados** → `jdpg` → `mutirao`.

| Conferir | Esperado |
|---|---|
| O documento `mutirao` existe | ✅ |
| Campo `entregas` | texto JSON contendo `R2-TESTE` |
| Campo `ts` | número |
| Campo `schemaVersion` | `1` |
| **`jdpg/grupos`** | **`updateTime` NÃO mudou** ← prova o isolamento |

📸 **Evidência:** captura da tela do Console mostrando o documento.

> ⚠️ Anote o `updateTime` de `jdpg/grupos` **antes** de começar tudo, para poder comparar.

---

# 5. R2-C — ⭐ A pré-condição de concorrência (um aparelho)

**Esta é a etapa que prova a trava contra o Firestore de verdade.**

Simula dois aparelhos: lê **uma vez**, grava **duas vezes** usando o **mesmo carimbo antigo**. A segunda tem de ser recusada.

```
const cfg = loadFbConfig();

// 1. Lê UMA vez e guarda o carimbo
const base = await mutiraoFbRead(cfg);
console.log('carimbo lido:', base.updateTime);

// 2. Primeira gravação — deve PASSAR
const w1 = await mutiraoFbWrite(cfg, base.entregas.concat([teste(2)]), base.updateTime);
console.log('1a gravacao:', w1);

// 3. Segunda gravação com o MESMO carimbo antigo — deve ser RECUSADA
const w2 = await mutiraoFbWrite(cfg, base.entregas.concat([teste(3)]), base.updateTime);
console.log('2a gravacao:', w2);
```

| Resultado | Veredito |
|---|---|
| `w1.ok === true` **e** `w2.preconditionFailed === true` | ✅ **A TRAVA FUNCIONA NO FIRESTORE REAL** |
| `w2.ok === true` | ❌ **FALHA GRAVE** — a pré-condição não está sendo honrada. **PARAR e reportar** |

## 5.1 E o laço se recupera?

```
mutiraoSaveEntregas(mutiraoLoadEntregas().concat([teste(4)]));
mutiraoConflitos = 0;
const s = await sincronizarMutirao();
console.log('sync:', s, '| conflitos:', mutiraoConflitos);
```

**Esperado:** `s.ok === true` — o laço releu, remesclou e gravou. Nada se perdeu.

---

# 6. R2-D — ⭐ Simultaneidade com dois aparelhos

> **Nota importante:** `jdpg/mutirao` é **um único documento para todos os PGs**. Portanto os
> dois aparelhos **não precisam estar no mesmo PG** — qualquer par de gravações simultâneas
> na instituição disputa o mesmo documento. Isso torna o teste mais fácil de montar, e também
> é uma característica real do sistema que vale conhecer.

## 6.1 Preparação

| | |
|---|---|
| Aparelho **A** | versão candidata, participante inscrito, Console aberto se possível |
| Aparelho **B** | versão candidata, participante inscrito |
| Quantia | **0,1 kg** nos dois — marcador mínimo, fácil de identificar e anular depois |

## 6.2 O teste

| Passo | |
|---|---|
| 1 | Nos **dois** aparelhos: abrir 🎁 Mutirão de Natal e **esperar a tela carregar** (isso sincroniza — os dois passam a conhecer o mesmo estado) |
| 2 | Nos **dois**: digitar `0,1` e **parar antes** de tocar em REGISTRAR |
| 3 | Tocar em **REGISTRAR** no A e, **em menos de 2 segundos**, no B |
| 4 | Aguardar as duas telas responderem |
| 5 | Conferir no Console do Firebase o campo `entregas` |

| Esperado | |
|---|---|
| **As DUAS entregas de 0,1 kg estão no documento** | ⭐ o resultado que importa |
| Nenhuma entrega anterior sumiu | |
| Os dois aparelhos, ao reabrir a tela, mostram o **mesmo total** | |

**Evidência obrigatória:** contagem de entregas **antes** e **depois**, e a captura do documento no Console. *"Funcionou" não é evidência.*

## 6.3 A trava disparou?

Em qualquer um dos aparelhos, no Console do navegador:

```
mutiraoConflitos
```

| Valor | Leitura |
|---|---|
| `≥ 1` | ✅ **a trava atuou** — houve disputa real e o laço resolveu |
| `0` | as gravações não se cruzaram. **Repita o passo 3 mais rápido** até conseguir pelo menos uma disputa |

Também aparece no console a linha:
`Mutirão: trava de concorrência disparou na tentativa 1 — outro aparelho gravou primeiro.`

## 6.4 Variante sob rede ruim (opcional, mas é o cenário do hospital)

Repetir com **um** aparelho em rede fraca ou modo avião por 2 s no meio da gravação.
**Esperado:** o aparelho degradado demora mais; **em nenhuma hipótese a entrega do outro desaparece.**

---

# 7. R2-E — Persistência, reentrada e limpeza

## 7.1 Persistência (fechar o PWA de verdade)

| Passo | |
|---|---|
| 1 | Registrar 0,1 kg |
| 2 | **Fechar o app pelo alternador de aplicativos** (não só voltar à tela inicial) |
| 3 | Abrir de novo pelo atalho |
| 4 | Abrir 🎁 Mutirão de Natal |

**Esperado:** a entrega continua no histórico e o total do PG está correto.

> É o achado de campo mais recorrente deste projeto. **Confirmar a versão na tela antes de cada rodada** — ao retomar do segundo plano o código não é recarregado (achado F-74).

## 7.2 Reentrada

Aceitar um convite novo (ou limpar os dados do site e reentrar) e conferir que **o histórico de entregas da pessoa continua visível** — casa por nome quando o `memberId` muda.

## 7.3 Limpeza — ⚠️ a ordem importa

**Anular é o caminho certo.** Não tente esvaziar a nuvem.

```
// Em CADA aparelho que participou:
const alvos = mutiraoLoadEntregas().filter(e =>
  e.pgNum === 999 || (e.quantidadeKg === 0.1 && !e.removed));
alvos.forEach(e => anularEntregaNatal(e.entregaId));
await sincronizarMutirao();
console.log('anuladas:', alvos.length);
```

| | |
|---|---|
| As entregas **permanecem** no documento, marcadas `removed: true` | é a trilha de auditoria, por desenho |
| Elas **não contam** em nenhum total | ✅ |
| O tombstone **se propaga** para os outros aparelhos | ✅ e isso também testa a mesclagem |

❌ **NÃO faça:** gravar `entregas: []` na nuvem. Qualquer aparelho que ainda tenha as entregas localmente as devolve no próximo sync.

---

# 8. Ficha de evidência

Uma por etapa.

```
ETAPA            :  R2-A / B / C / D / E
DISPOSITIVO      :  (modelo, sistema, navegador)
VERSÃO NA TELA   :  (conferida, não presumida)
REGRA PUBLICADA  :  (data e hora)
HORÁRIO          :
updateTime ANTES :
updateTime DEPOIS:
Nº ENTREGAS ANTES:
Nº ENTREGAS DEPOIS:
mutiraoConflitos :
RESULTADO        :
PASS / FAIL      :
EVIDÊNCIA        :  (captura do Console do Firebase)
jdpg/grupos MUDOU?: (tem de ser NÃO)
```

---

# 9. Critério de aprovação do R2

```
[ ] R2-A  a regra publicada aceitou a gravação (sem 403)
[ ] R2-B  o documento jdpg/mutirao existe e tem o conteúdo esperado
[ ] R2-B  jdpg/grupos NÃO foi alterado
[ ] R2-C  ⭐ a 2ª gravação com carimbo velho foi RECUSADA pelo Firestore real
[ ] R2-C  o laço releu, remesclou e gravou sem perder nada
[ ] R2-D  ⭐ as duas entregas simultâneas sobreviveram
[ ] R2-D  mutiraoConflitos ≥ 1 (houve disputa real)
[ ] R2-E  a entrega sobreviveu a fechar e reabrir o PWA
[ ] R2-E  o histórico sobreviveu à reentrada
[ ] a limpeza por tombstone se propagou entre os aparelhos
[ ] nenhum comportamento inexplicável
```

**Só com todos marcados:** R2 aprovado → T9 fechado → homologação do Mutirão encerrada.

## 9.1 Se algo falhar

Mesma disciplina do `AUDIT-17`: **não corrigir de imediato.** Registrar a ficha completa, **não repetir por cima**, exportar o documento do Firestore naquele instante, e só então investigar. E distinguir falha do código de falha do protocolo — nas fases anteriores desta auditoria, **cinco "defeitos" acabaram sendo erro da bancada**.

---

# 10. 🟡 ACHADO — capacidade do documento

Medi o tamanho real de uma entrega, com UUIDs de verdade e nome completo:

| | |
|---|---|
| Entrega de participante | **455 bytes** |
| Entrega externa | **393 bytes** |
| Entrega anulada (com tombstone) | **578 bytes** |
| Média | **424 bytes** |

| | |
|---|---|
| Teto da regra (`entregas.size() < 500000`) | ~**1 179** entregas |
| Guarda do app (aborta em 480 000) | ~**1 132** entregas |
| Distribuído por 70 PGs | ~**16 entregas por PG** |

**Isto não bloqueia o R2** — mas é um limite real da campanha. Se a expectativa for mais de ~1 100 entregas no total da instituição, o documento estoura e **a gravação passa a ser recusada** (o app avisa, não perde dado — mas ninguém mais consegue registrar).

**Não mexi em nada disso**, porque não foi pedido e porque mudar o formato agora invalidaria os testes. As saídas possíveis, quando você quiser decidir:

1. **Encurtar os campos** (`registradoPor` guarda nome e memberId que se repetem no `participante`) — ganho fácil de ~30%.
2. **Um documento por edição/mês** — `jdpg/mutirao-2026`.
3. **Quebrar por faixa de PG** — mais complexo, provavelmente desnecessário.

**Pergunta para você:** quantas entregas você espera na campanha inteira? Se for algo como 300–500, não há problema nenhum. Se for perto de mil, vale resolver **antes** de publicar.

---

# 11. O que este protocolo NÃO cobre

| | |
|---|---|
| Volume real | o documento de teste terá poucas entregas; o peso de mil não será reproduzido |
| Latência do hospital | modo avião não reproduz rede lenta e instável |
| Convivência de versões | o app publicado não conhece `jdpg/mutirao` — não há o que testar aqui, e isso é a vantagem da Opção 2 |
| **R2 do `AUDIT-17`** | **continua pendente e é independente deste.** A reentrada de convite da `1.3.0-rc1` ainda não foi validada em campo |
