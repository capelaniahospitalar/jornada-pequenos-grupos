# MUTIRÃO DE NATAL 2026 · FASE 12 — Sincronização em `jdpg/mutirao`

**Data:** 2026-09-08 · **Base:** `aad14d9` (FASE 11 commitada) · **Decisão do usuário: OPÇÃO 2**
**Alteração:** `index.html` **336 inserções, 4 remoções** · `firestore.rules` **21 inserções, 0 remoções**

---

# 1. As três garantias que você exigiu

| Exigência | Situação | Prova |
|---|---|---|
| **Nenhum registro pode ser perdido em gravação simultânea** | ✅ | teste **N-11** (§3) |
| **Não alterar a estrutura de `jdpg/grupos`** | ✅ | `FB_CAMPOS_CONTRATO` continua `dados, tutores, convites, setoresMestre, setoresEfetivo, embaixadoresExternos` — inalterado |
| **Não alterar convites/reentrada homologados** | ✅ | `autoTesteB1` (convites e reentrada) segue **46/46**; nenhuma linha de `fbReadDoc`, `fbWriteGrupos`, `commitConviteChange` ou `trySaveGrupos` foi tocada |

O Mutirão ganhou um **caminho de rede paralelo e independente**: `mutiraoFbRead` / `mutiraoFbWrite` / `sincronizarMutirao`. O caminho dos grupos não sabe que ele existe.

---

# 2. Como a perda de registro foi tornada impossível

Há **duas camadas**, e a segunda é a que realmente dá a garantia.

## 2.1 Camada 1 — trava de concorrência (obrigatória)

| Situação | O que é enviado |
|---|---|
| O documento já existe | `currentDocument.updateTime=<versão lida>` — só grava se ninguém mexeu desde a leitura |
| O documento ainda não existe | `currentDocument.exists=false` — só cria se ninguém criou antes |

Recusa do servidor (`FAILED_PRECONDITION`) → o laço **relê a nuvem, remescla e tenta de novo**.

> Este é o ponto onde a implementação mais provavelmente daria errado: se a retentativa reenviasse o **mesmo payload** montado antes, ela gravaria por cima do que o outro aparelho acabou de escrever. Por isso o laço recomeça **do zero** a cada tentativa — leitura nova, mesclagem nova.

## 2.2 Camada 2 — a mesclagem, que é a garantia de verdade

> **O conjunto de entregas só cresce.**

Cada entrega tem `entregaId` único, e a união por esse id é:

- **comutativa** — tanto faz quem gravou primeiro;
- **idempotente** — repetir a mesclagem não muda nada;
- **monotônica no tombstone** — `removed` só anda de `false` para `true`.

**Consequência:** mesmo que a trava falhasse, o pior caso desta mesclagem é gravar duas vezes o mesmo conjunto — **nunca perder um registro, nunca "desanular" uma entrega que alguém anulou.**

É por isso que não bastou a trava. A trava evita o entrelaçamento; a mesclagem torna a perda **estruturalmente impossível**.

---

# 3. ⭐ O teste de lost update

Reproduzido de propósito, com um Firestore falso em memória que **honra a pré-condição de verdade**:

```
Estado inicial da nuvem:  [A]  (versão v1)

Aparelho A:  tem [A, A1]  → sincroniza → grava sobre v1 → nuvem = [A, A1]  (v2)
Aparelho B:  tem [A, B1]  → JÁ TINHA LIDO a v1, antes de A gravar
             → tenta gravar sobre v1 → RECUSADO pela trava
             → relê (v2), remescla, grava sobre v2
```

| Teste | Resultado |
|---|---|
| N-09 aparelho A gravou | ✅ |
| N-10 aparelho B foi **recusado** pela trava e tentou de novo | ✅ `recusas=1`, sucesso na 2ª tentativa |
| **N-11 ⭐ NENHUMA ENTREGA SE PERDEU** | ✅ **nuvem = `A, A1, B1`** |
| N-12 o aparelho B terminou enxergando as duas | ✅ `A, A1, B1` |

---

# 4. A bateria completa de sincronização

**15 testes, 15 passaram:**

```
✅ N-01 mesclagem une por entregaId
✅ N-02 mesclar duas vezes dá o mesmo resultado (idempotente)
✅ N-03 a ordem não importa (comutativa)
✅ N-04 anulada vence a viva, venha de que lado vier
✅ N-05 uma entrega anulada nunca "revive"
✅ N-06 primeira sincronização CRIA o documento e envia o local
✅ N-07 sem mudança, não grava de novo
✅ N-08 a nuvem traz de volta a entrega de outra pessoa
✅ N-09 · N-10 · N-11 · N-12   (lost update — §3)
✅ N-13 conflito persistente devolve erro, sem perder nada no aparelho
✅ N-14 erro permanente (403) é reportado, não retentado
✅ N-15 a chave real nunca foi tocada
```

## 4.1 Regressão total

| Bateria | Testes | Falhas |
|---|---|---|
| `autoTesteB1` — **convites e reentrada** | 46 | **0** |
| `autoTesteB2` — robustez | 42 | **0** |
| `autoTesteE1` — contrato de gravação dos **grupos** | 27 | **0** |
| `autoTesteFase4` — invariantes | 11 | **0** |
| `autoTesteMutirao` — serviços | 49 | **0** |
| `autoTesteMutiraoPermissoes` | 20 | **0** |
| `autoTesteMutiraoMatriz` — T1–T10 | 17 | 0 (1 bloqueado) |
| **`autoTesteMutiraoSync` — NOVA** | **15** | **0** |
| **TOTAL** | **227** | **0 falhas** |

---

# 5. 🔴 O QUE VOCÊ PRECISA FAZER — publicar a regra

**Sem isto, nada funciona.** Toda gravação volta **403** e o app mostra **"sem conexão"** — a armadilha já conhecida deste projeto.

**Onde:** Console do Firebase → projeto `jornada-pequenos-grupos` (conta Google **"OQQÉ? Tutorial"**, não a "Wladimir") → Firestore Database → aba **Regras** → colar o texto inteiro → **Publicar**.

O bloco novo é este — os outros dois continuam **exatamente** como estão hoje:

```
    match /jdpg/mutirao {
      allow read: if true;
      allow write: if request.resource.data.keys().hasOnly(['entregas','ts','schemaVersion'])
        && request.resource.data.entregas is string
        && request.resource.data.entregas.size() < 500000
        && (!('ts' in request.resource.data) || request.resource.data.ts is int)
        && (!('schemaVersion' in request.resource.data) || request.resource.data.schemaVersion is int);
    }
```

O texto completo para colar está em `firestore.rules` no repositório e no arquivo que te enviei.

## 5.1 ⚠️ O risco que preciso declarar

O Console exige publicar o **texto inteiro**, não só o pedaço novo. Ou seja: os blocos de `jdpg/grupos` e `embaixadoresExternos` serão **republicados**.

Eles vão idênticos, letra por letra — conferi que o meu diff **não removeu nenhuma linha** deles. Mas o ato de republicar não é risco zero, e você pediu para reportar dependências técnicas antes. **Está reportado.** Se preferir, dá para copiar só o bloco novo e colá-lo à mão entre os dois existentes, no editor do Console.

---

# 6. Onde a sincronização acontece

| Momento | Por quê |
|---|---|
| Ao abrir a tela do Mutirão | puxa o que os outros registraram |
| Ao abrir o Mutirão no Painel | idem, para o Coordenador |
| Depois que o participante registra | envia a entrega |
| Depois que o Coordenador lança um externo | envia a entrega |

**A rede nunca segura a tela.** A entrega é salva primeiro no aparelho, a tela já responde, e o envio acontece em seguida. Se a rede falhar, a entrega **continua no aparelho** e sobe no próximo sync — não se perde.

---

# 7. O que ainda NÃO está provado

## 7.1 A camada HTTP em si

Os 15 testes exercitam o **laço de sincronização** com um servidor falso. Eles provam a lógica de mesclagem, a retentativa e a proteção contra lost update.

**Não provam** a montagem real da URL, a sintaxe da pré-condição do Firestore nem a regra publicada — porque no modo de teste isolado nada toca a rede, e isso é proposital. É a mesma limitação que `autoTesteE1` já declara para os grupos.

**Isso só se prova em campo.**

## 7.2 O T9 mudou de motivo

O T9 continua **BLOQUEADO**, mas por outra razão — atualizei a mensagem dentro da própria bateria, porque a anterior virou mentira:

> *A sincronização EXISTE desde a FASE 12. O que falta agora é EXECUÇÃO EM CAMPO: dois aparelhos físicos e a regra do Firestore publicada no Console.*

## 7.3 Você tem razão sobre a homologação

Você escreveu que os 212 testes não encerram a homologação. Agora são 227 — e continua valendo. O teste crítico é o comportamento real entre aparelhos, porque é ali que a persistência e a concorrência deixam de ser teste de interface e passam a validar a arquitetura de dados.

**Concordo, e a implementação de hoje não muda isso.**

---

# 8. Caminho até a publicação

```
   [ AGORA ]  227 testes · 0 falhas · sincronização implementada
      │
      ├─ 1. PUBLICAR a regra do Firestore          ← você, no Console
      ├─ 2. Escrever o protocolo R2 do Mutirão      ← eu, agora que sei como o sync ficou
      ├─ 3. Executar o R2 — 2 aparelhos reais
      ├─ 4. Executar o R2 do AUDIT-17 (reentrada de convite), ainda pendente
      ├─ 5. Nova RC
      └─ 6. Merge para a main = PUBLICAÇÃO
```

## 8.1 Pendências menores

| | |
|---|---|
| **Botão de desfazer** | motor pronto e provado — falta o botão |
| **`kgMax = 200`** | suposição minha, nunca confirmada |
| **Campo de setor do externo** | desempataria homônimos |

---

# 9. Situação

| | |
|---|---|
| FASE 0 → 12 | ✅ executadas |
| Sincronização | ✅ implementada em `jdpg/mutirao` com trava obrigatória |
| Perda de registro em concorrência | ✅ **estruturalmente impossível** (N-11) |
| `jdpg/grupos` | 🔒 **intocado** |
| Convites e reentrada | 🔒 **intocados** — 46/46 |
| **Regra do Firestore** | 🔴 **aguardando publicação no Console** |
| `main` | 🔒 intocada em `1aafe63` |
| Produção | 🔒 nenhuma escrita |
