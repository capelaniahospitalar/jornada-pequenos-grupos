# MUTIRÃO DE NATAL 2026 · FASE 4 — Tela do participante

**Data:** 2026-09-08 · **Base:** `9d11e9b` (FASE 3 commitada) · **Status:** ✅ implementada e verificada
**Alteração:** `index.html` — **165 inserções, 24 remoções.** As 24 remoções são o conteúdo expansível do card da FASE 3, que **virou a tela** (§5).

---

# 1. ✅ Critério de aceite — verificado em execução

| Exigência | Resultado |
|---|---|
| Clicar em MUTIRÃO DE NATAL abre área específica | ✅ `#screen-mutirao` fica ativa |
| Título "MUTIRÃO DE NATAL 2026" | ✅ `🎁 Mutirão de Natal 2026` |
| "Minha entrega" com a pergunta e o campo `[__ kg]` | ✅ |
| Botão REGISTRAR ENTREGA | ✅ |
| Depois: Minha participação — total + histórico | ✅ |
| Depois: Meu PG — total arrecadado | ✅ |
| **Sem campo para escolher quem doou** | ✅ **§2** |

---

# 2. A regra antifraude — como foi garantida

> *"O participante não deve ter um campo para escolher quem fez a doação."*

**Verificado por varredura do DOM da tela:**

```
Campos de entrada em #screen-mutirao:
  [ { id: "mut-kg", tag: "INPUT", tipo: "text" } ]

Campo além dos quilos: FALSE
```

**Há exatamente um campo na tela, e ele é a quantidade.** Não existe seletor de pessoa, campo de nome, nem lista de participantes.

A autoria não é escolhida — é **derivada**. `registrarMinhaEntregaNatal()` (FASE 2) não aceita parâmetro de identidade: a pessoa vem de `loadMeuGrupo()` e `getMyMemberId()` do próprio aparelho. Isso já estava provado pelos testes **M-13** e **M-14**, que mostram que passar outra identidade de propósito é simplesmente ignorado.

Além disso, a tela **mostra a atribuição antes de registrar**:

> *A entrega será registrada em seu nome: **Maria da Silva***

Assim a pessoa vê de quem será o registro antes de confirmar — transparência, não só bloqueio.

---

# 3. Fluxo verificado, passo a passo

| Passo | Entrada | Resultado |
|---|---|---|
| 1 | `dez` | ❌ recusado — *"Informe um valor entre 0,1 e 200 kg."* · nada registrado |
| 2 | `1000` | ❌ recusado — o guarda contra erro de digitação funcionou · nada registrado |
| 3 | `7,5` | ✅ registrado · Minha participação **7,5 kg** · Meu PG **19,5 kg** |
| 4 | `3` | ✅ registrado · Minha participação **10,5 kg** · Meu PG **22,5 kg** |

**Histórico exibido:** `08/09 — 3 kg` · `08/09 — 7,5 kg` (mais recente primeiro).

**Confirmação após registrar:** *"✅ Entrega de 3 kg registrada. Obrigado!"*

**Meu PG = 22,5 kg** = 10,5 kg dos participantes + 12 kg de um externo lançado pelo coordenador. As duas origens somam no total do PG **sem se misturarem** na contagem — exatamente o contrato da FASE 1.

**Vírgula decimal funciona** (`7,5`), como se digita em português.

---

# 4. Sem regressão

| Bateria | Resultado |
|---|---|
| `autoTesteMutirao()` — camada de serviços | **0 falhas de 30** |
| `autoTesteFase4()` — invariantes do app | **0 falhas de 11** |
| `autoTesteE1()` — contrato de gravação | **0 falhas de 27** |
| **Total** | **68 testes, 0 falhas** |

**Home conferida:** Progresso ausente ✅ · card do grupo presente 1 vez ✅ · as 6 áreas da Home presentes ✅ · o card do Mutirão passou a abrir a tela (`onclick="openMutirao()"`) e o total acompanhou (22,5 kg) ✅

---

# 5. O que mudou no card da Home

Na FASE 3 o card **expandia** e mostrava os números ali mesmo. Agora ele **abre a tela**, onde a pessoa registra e vê o histórico.

As 24 linhas removidas no diff são justamente esse conteúdo expansível, que **migrou para a tela** — nenhuma função, dado ou cálculo foi removido. O card ficou mais simples: ícone, nome, total e a seta `›`, no mesmo padrão dos outros botões de navegação da Home.

---

# 6. Uma função nova na camada de serviços

`listarMinhasEntregasNatal(pgNum)` — as minhas entregas.

Casa por `memberId` **ou** por nome, a mesma regra de `getMinhaFuncaoNoGrupo()`. Só o `memberId` não bastaria: neste app, quem reentra por um convite pode receber identidade nova, e o histórico da própria pessoa não pode sumir da tela por causa disso.

---

# 7. ⚠️ Ressalvas honestas

## 7.1 Ainda não sincroniza — e agora isso pesa mais

Os dados continuam **só no aparelho**. Duas pessoas do mesmo PG não veem as entregas uma da outra, e o "Meu PG" que cada uma enxerga é só o que passou pelo próprio celular.

Na FASE 3 isso era um detalhe técnico. **Agora que as pessoas vão digitar de verdade, virou a limitação principal.** Depende da decisão em aberto: Opção 1 (campo `mutirao` em `jdpg/grupos`) × **Opção 2 (documento próprio `jdpg/mutirao`, recomendada)**.

## 7.2 🔶 Não existe como corrigir um erro de digitação

Se alguém registrar 30 kg em vez de 3, **não há botão para desfazer**. O dado fica.

A função `anularEntregaNatal()` já existe desde a FASE 2 e **já permite que o próprio autor anule** a entrega (com tombstone, sem apagar). Falta só expor isso na tela — um "desfazer" discreto em cada linha do histórico.

**Não implementei porque não estava no seu pedido.** Recomendo incluir: é barato, o motor já está pronto e testado, e evita dado errado permanente numa campanha que envolve muita gente digitando no celular.

## 7.3 Outras

- **`kgMax = 200`** continua sendo suposição minha (§7.1 da FASE 1, pergunta 2).
- **A verificação usou participante simulado.** Em modo de teste não há inscrição real; o caminho de um participante de verdade só será exercitado no R2.
- **A tela do Coordenador (registro de externo) ainda não existe** — a função `registrarEntregaExternaNatal()` está pronta e testada, mas sem interface.

---

# 8. Situação

| | |
|---|---|
| FASE 0 · 1 · 2 · 3 | ✅ concluídas |
| FASE 4 | ✅ concluída e verificada |
| Tela do Coordenador (externos) | ⏳ sem interface |
| Botão de desfazer | ⏳ recomendado, aguardando sua decisão |
| Sincronização na nuvem | ⏳ decisão Opção 1 × 2 em aberto |
| `main` | 🔒 intocada em `1aafe63` |
| Produção | 🔒 nenhuma escrita |
