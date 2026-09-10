# MUTIRÃO DE NATAL 2026 · FASE 11 — Homologação

**Data:** 2026-09-08 · **Base:** `c119358` (FASE 10 commitada) · **Árvore limpa, `main` intocada em `1aafe63`**
**Alteração no código:** **nenhuma.** Esta fase é só verificação.

---

# 1. VEREDITO

| Etapa | Situação |
|---|---|
| **R1** — teste funcional em navegador | ✅ **APROVADO** |
| **R2** — dois aparelhos | ⛔ **NÃO EXECUTADO** — 1 dos 5 itens é impossível hoje; os outros 4 são executáveis (§3) |
| **R3** — regressão | ✅ **APROVADO** |

> **A homologação não pode ser fechada.** Falta o R2, e ele depende de uma decisão sua e de uma janela com dois aparelhos.

---

# 2. R1 — Teste funcional em navegador ✅

Servidor local, navegador real, modo de teste isolado.

## 2.1 Todas as telas do app abrem sem erro

19 telas exercitadas, **nenhuma exceção**:

```
✅ renderHome        ✅ openMutirao      ✅ openComunidade   ✅ openInscricao
✅ openPanel         ✅ openTutorPanel   ✅ openGrupos       ✅ openDesafios
✅ openMissoes       ✅ openObstaculos   ✅ openJournal      ✅ openEncontros
✅ openCompanion     ✅ openEncerramento ✅ openShare        ✅ openBonus
✅ openFbSetup       ✅ openAI           ✅ goHome
```

Nenhuma tentou abrir janela externa (`window.open` interceptado: 0 chamadas).

## 2.2 Percurso completo do Mutirão, como um usuário faria

| Passo | Resultado |
|---|---|
| 1. Participante abre a Home | ✅ card **"Mutirão de Natal · 0 kg"** presente |
| 1b. Progresso do PG | ✅ **oculto** |
| 1c. Card do grupo (flâmula + inscrição) | ✅ **preservado** |
| 2. Toca no card | ✅ abre `screen-mutirao` |
| 3. Digita `7,5` e registra | ✅ *"7,5 kg registrados. Veja abaixo, no seu histórico."* |
| 3b. Histórico | ✅ `08/09 — 7,5 kg` |
| 4. Volta à Home | ✅ card atualizou para **19,5 kg** |
| 5. Coordenadora lança externo no Painel | ✅ `João Pereira · 03/12 · 12 kg` na lista |
| 6. Dashboard | ✅ `19,5 kg` · 1 participante · 1 externo |
| 7. Dados brutos | ✅ contrato completo da FASE 8 |

### ⚠️ Um susto que não era defeito

Na primeira passada, o passo 4 mostrou **"0 kg"** e parecia bug. Fui verificar antes de reportar: `renderHome()` monta os cards dentro de um `setTimeout(…, 30)`, e o meu teste leu o DOM **antes** disso. Medindo de novo com espera:

```
imediatamente após goHome():  19,5 kg
100 ms depois:                19,5 kg
500 ms depois:                19,5 kg
```

**Era o teste lendo cedo demais, não o app.** Registro aqui porque um "0 kg" mal interpretado teria virado uma caça a bug inexistente.

## 2.3 Nada saiu da máquina

| | |
|---|---|
| Requisições a `firestore` | **nenhuma** |
| Requisições a `googleapis` | **nenhuma** |
| Chave real `jdpg_mutirao_natal_v1` | **`null`** |

Os erros que aparecem no console (`intenção inválida`, `payload perderia os PGs 51–70`, `HTTP 503`) são as **próprias baterias provando que as travas disparam** — `autoTesteE1` faz de propósito uma chamada no formato antigo, `B1` força a guarda de perda e `B2` simula erro transitório. São asserções, não falhas.

---

# 3. R2 — Dois aparelhos ⛔

## 3.1 Por que não foi executado

Duas razões, e só uma delas é logística:

| Razão | |
|---|---|
| **Falta a funcionalidade** | O item *"atualização dos totais"* entre aparelhos **não pode passar**: não existe sincronização (T9 da FASE 10). Não é falta de aparelho — é falta de código que nunca foi escrito |
| **Exige campo** | Dois celulares físicos, WhatsApp e uma pessoa operando |

## 3.2 🟢 Mas 4 dos 5 itens JÁ são testáveis em aparelho real, hoje

Este é o achado prático desta fase. Dos cinco itens que você listou:

| Item do R2 | Executável hoje? |
|---|---|
| Participante registrando sua entrega | ✅ **sim**, em aparelho real |
| Coordenador registrando externo | ✅ **sim** |
| **Atualização dos totais** (entre aparelhos) | ⛔ **não** — depende da sincronização |
| Persistência (fechar o PWA e reabrir) | ✅ **sim** — e é o achado de campo mais recorrente deste projeto |
| Reentrada no aplicativo | ✅ **sim** |

**Sugestão:** vale rodar esses 4 num celular seu antes mesmo da sincronização existir. Persistência e reentrada em PWA real são justamente o que a bancada não alcança — e se houver problema ali, é melhor descobrir agora do que depois de construir a sincronização em cima.

## 3.3 O roteiro completo virá depois da decisão

Não escrevi o protocolo detalhado do R2 do Mutirão porque **ele depende de como a sincronização for feita** — Opção 1 (campo em `jdpg/grupos`) e Opção 2 (documento `jdpg/mutirao`) exigem passos de verificação diferentes, inclusive regras diferentes no Firestore.

Escrever agora seria inventar um roteiro para um sistema que ainda não existe. Quando a decisão sair, ele nasce junto — nos moldes do `AUDIT-17-PROTOCOLO-R2.md`, que já cobre a reentrada de convite.

---

# 4. R3 — Regressão ✅

## 4.1 As 7 baterias automáticas

| Bateria | Cobre | Testes | Falhas |
|---|---|---|---|
| `autoTesteB1` | **convites e reentrada** | 46 | **0** |
| `autoTesteB2` | robustez, timeout, retry, envelhecimento de convite | 42 | **0** |
| `autoTesteE1` | contrato único de gravação | 27 | **0** |
| `autoTesteFase4` | invariantes dos PGs (slot único, `pgId` único, capacidade) | 11 | **0** |
| `autoTesteMutirao` | serviços do Mutirão | 49 | **0** |
| `autoTesteMutiraoPermissoes` | permissões | 20 | **0** |
| `autoTesteMutiraoMatriz` | T1–T10 | 17 | 0 (1 bloqueado) |
| **TOTAL** | | **212** | **0 falhas** |

> As baterias **B1 (46) e B2 (42) são anteriores ao Mutirão**. Elas continuam passando inteiras depois de 10 fases de alteração — é a evidência mais forte de que nada foi quebrado.

## 4.2 Item a item, como você pediu

| O que | Como foi verificado |
|---|---|
| **Convites** | B1 + B2 (88 testes): criação, aceite, revogação, idempotência, expiração, carimbo |
| **Reentrada** | B1 + T8b da matriz: reentrada com `memberId` novo mantém o histórico |
| **PGs** | `autoTesteFase4`: slot único, `pgId` único, capacidade de 70 |
| **Participantes** | B1: entrada, duplicidade, tombstone, reconciliação de identidade |
| **Tutor** | Painel do Tutor renderiza sem erro, com "Progresso semanal" e "Nível do PG" |
| **Coordenador** | Painel + registro de externo + travas de autoridade (20 testes da FASE 9) |
| **Demais telas** | as 19 telas abrem sem exceção (§2.1) |

## 4.3 O Progresso do PG continua íntegro

| | |
|---|---|
| Na Home do participante | **oculto** ✅ |
| No Painel do Tutor/Coordenador | **visível**: "Progresso semanal do grupo" e "Nível do Pequeno Grupo" ✅ |
| Funções de cálculo | as 10 presentes e respondendo ✅ |
| CSS | intacto ✅ |
| Restaurar | trocar `false` por `true` ✅ |

---

# 5. O que ainda impede fechar a homologação

```
   [ HOJE ]  212 testes · 0 falhas · R1 ✅ · R3 ✅
      │
      ├─ 1. DECIDIR  Opção 1 × Opção 2                     ← só você
      ├─ 2. IMPLEMENTAR a sincronização (+ regra no Firestore)
      ├─ 3. Escrever o protocolo R2 do Mutirão
      ├─ 4. Executar R2 — Mutirão + AUDIT-17 (reentrada de convite)
      ├─ 5. Nova RC
      └─ 6. Merge para a main = PUBLICAÇÃO
```

## 5.1 Pendências menores, registradas

| | |
|---|---|
| **Botão de desfazer** | motor pronto e provado (S-10, S-18) — falta o botão na tela |
| **`kgMax = 200`** | suposição minha, nunca confirmada |
| **Campo de setor do externo** | desempataria homônimos |

---

# 6. Situação

| | |
|---|---|
| FASE 0 → 11 | ✅ executadas |
| R1 · R3 | ✅ aprovados |
| **R2** | ⛔ **não executado** — 1 item impossível sem sincronização, 4 já testáveis em campo |
| **Homologação** | ⛔ **não fechada** |
| `main` | 🔒 intocada em `1aafe63` |
| Produção | 🔒 nenhuma escrita |
