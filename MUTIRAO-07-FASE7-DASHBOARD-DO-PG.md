# MUTIRÃO DE NATAL 2026 · FASE 7 — Dashboard do PG

**Data:** 2026-09-08 · **Base:** `1d45370` (FASE 6 commitada) · **Status:** ✅ implementada e verificada
**Alteração:** `index.html` — **59 inserções, 13 remoções.** As 13 remoções são o bloco "Resumo do PG" da FASE 5, que **virou** este dashboard, mais duas variáveis que ficaram órfãs por causa disso (§5).

---

# 1. Como ficou

```
DASHBOARD DO PG

ARRECADAÇÃO
34 kg
total arrecadado pelo Pequeno Grupo

┌─────────────────────┐  ┌─────────────────────┐
│ PARTICIPAÇÃO DO PG  │  │ MOBILIZAÇÃO EXTERNA │
│ 2                   │  │ 2                   │
│ participantes       │  │ colaboradores       │
│ entregaram          │  │ externos entregaram │
└─────────────────────┘  └─────────────────────┘

ORIGEM DOS KG
ORIGEM                              KG
Participantes do PG               14,5
Colaboradores externos            19,5
Total                               34
```

Fica no Painel do Tutor/Coordenador, dentro de 🎁 Mutirão de Natal, no lugar do antigo "Resumo do PG".

---

# 2. ✅ Critério de aceite

| Indicador pedido | Situação |
|---|---|
| **ARRECADAÇÃO** — Total de kg | ✅ `34 kg` |
| **PARTICIPAÇÃO DO PG** — XX participantes entregaram | ✅ `2 participantes entregaram` |
| **MOBILIZAÇÃO EXTERNA** — XX colaboradores externos entregaram | ✅ `2 colaboradores externos entregaram` |
| **ORIGEM DOS KG** — tabela Origem × Kg com Total | ✅ tabela com as três linhas |

---

# 3. Verificações que fiz além do óbvio

## 3.1 A tabela fecha

Conferido em execução, lendo os números **da tela** (não do código):

```
14,5  +  19,5  =  34   ✅ bate com o total exibido em cima
```

Isso importa por causa do princípio de transparência já adotado no projeto (RC4.8.1-3): **todo número exibido tem de ser auditável na própria tela, sem componente oculto.** Aqui, as duas linhas da tabela somam exatamente o número grande da Arrecadação — quem olha consegue conferir com os olhos.

## 3.2 Concordância no singular

Com exatamente 1 de cada:

```
PARTICIPAÇÃO DO PG      1  participante entregou
MOBILIZAÇÃO EXTERNA     1  colaborador externo entregou
```

## 3.3 PG sem nenhuma entrega

Tudo zero, sem erro e sem tela quebrada:

```
ARRECADAÇÃO  0 kg  ·  0 participantes entregaram  ·  0 colaboradores externos entregaram
Participantes do PG 0 · Colaboradores externos 0 · Total 0
```

## 3.4 Nada mais quebrou

| Bateria | Resultado |
|---|---|
| `autoTesteMutirao()` | **0 falhas de 41** |
| `autoTesteFase4()` | **0 falhas de 11** |
| `autoTesteE1()` | **0 falhas de 27** |
| **Total** | **79 testes, 0 falhas** |

A tela do participante continua correta (2,5 kg meus · 4 kg do PG) e a Home segue intacta.

---

# 4. Onde os números nascem

O dashboard **não calcula nada**. Ele só exibe o que `resumoMutiraoDoPG()` devolve — a mesma função que já alimentava o resumo da FASE 5 e que está coberta pelos testes.

Isso é deliberado: se a tela fizesse a própria conta, existiriam **dois caminhos** para o mesmo número, e um dia eles divergiriam. Um caminho só, testado, é o que torna o indicador confiável.

---

# 5. As 13 linhas removidas

| O que saiu | Para onde foi |
|---|---|
| Bloco `<div class="panel-section">Resumo do PG…` (11 linhas) | virou `htmlMutiraoDashboard()` |
| `const r = resumoMutiraoDoPG(grupoNum)` | ficou órfã — quem chama agora é o dashboard |
| `const linha = (rot, val) => …` | ficou órfã pelo mesmo motivo |

As duas variáveis foram removidas **porque a minha mudança as deixou sem uso** — não eram código morto anterior.

---

# 6. Sobre "será útil para o ranking"

Os números estão prontos e num formato que serve: total, quilos por origem e contagem de pessoas por origem, todos vindo de uma função só.

**Duas ressalvas antes de partir para o ranking:**

1. **🔴 Os números ainda são por aparelho.** Um ranking construído sobre isso hoje classificaria os PGs pelo que cada celular por acaso conhece — não pelo que o PG realmente arrecadou. **Sem sincronização não existe ranking honesto.**

2. **Ligar o Mutirão ao IMD é decisão sua, não consequência automática.** O Ranking dos PGs tem régua própria, ainda em revisão, e o motor v3 está escrito mas não ativado. Misturar arrecadação de Natal com o IMD mudaria o significado do indicador. Se quiser ranking do Mutirão, minha sugestão é um **ranking separado**, só da campanha — mas não vou encostar nisso sem você pedir.

---

# 7. Pendências que continuam

| | |
|---|---|
| 🔴 **Sincronização** | decisão Opção 1 × Opção 2 — bloqueia a campanha, a prevenção de duplicidade e qualquer ranking |
| **Botão de desfazer** | motor pronto e testado desde a FASE 2, falta o botão |
| **`kgMax = 200`** | continua sendo suposição minha |
| **Campo de setor do externo** | opcional, desempata homônimos |
| **Verificação com dados simulados** | o caminho real só no R2 |

---

# 8. Situação

| | |
|---|---|
| FASE 0 → 7 | ✅ todas concluídas |
| Sincronização na nuvem | 🔴 **a única coisa que separa isto de ser usável** |
| `main` | 🔒 intocada em `1aafe63` |
| Produção | 🔒 nenhuma escrita |
