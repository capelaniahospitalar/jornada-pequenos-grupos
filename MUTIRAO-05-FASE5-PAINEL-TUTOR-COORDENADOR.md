# MUTIRÃO DE NATAL 2026 · FASE 5 — Painel do Tutor/Coordenador

**Data:** 2026-09-08 · **Base:** `09613fe` (FASE 4 commitada) · **Status:** ✅ implementada e verificada
**Alteração:** `index.html` — **141 inserções, 0 remoções.** Puramente aditiva.

---

# 1. ✅ Critério de aceite — verificado em execução

Um botão laranja **🎁 Mutirão de Natal** entra no detalhe do Pequeno Grupo, dentro do Painel. Ele abre uma área própria com os três blocos.

| Bloco | Situação |
|---|---|
| **A** — entregas dos participantes | ✅ |
| **B** — registrar participação externa (nome · quantidade · data) | ✅ |
| **C** — resumo do PG com quilos e contagem de pessoas | ✅ |

## 1.1 Bloco C, como ficou na tela

```
RESUMO DO PG

34 kg
total arrecadado pelo Pequeno Grupo

Participantes do PG                    14,5 kg
Colaboradores externos                 19,5 kg
Total                                    34 kg

Participantes do PG que entregaram          2
Colaboradores externos mobilizados          2
```

---

# 2. ⚠️ Uma mudança de rótulo que eu fiz — e por quê

Você escreveu:

> **A. Minhas entregas** — *Visualização das entregas feitas pelos participantes.*

O rótulo e a descrição apontam para coisas diferentes. No Painel, "Minhas entregas" sugere *as entregas de quem está olhando* — mas a descrição diz que é a visualização **das entregas dos participantes**.

**Segui a descrição e ajustei o rótulo para "Entregas dos participantes".** Um Coordenador vendo os nomes de Maria e Carla sob o título "Minhas entregas" leria errado.

**Se você quis mesmo dizer "as entregas do meu PG" e prefere o rótulo original, é uma linha para trocar.** Só não quis fazer essa escolha em silêncio.

---

# 3. Contagem de pessoas — o detalhe que importa

O bloco C pede **quantas pessoas**, não quantas entregas. São coisas diferentes e o teste provou a diferença:

| Cenário testado | Entregas | Pessoas |
|---|---|---|
| Maria entregou 2 vezes (7,5 kg + 3 kg), Carla 1 vez (4 kg) | 3 | **2 participantes** |
| João entregou 2 vezes (12 kg + 2 kg), Rita 1 vez (5,5 kg) | 3 | **2 externos mobilizados** |

Quem entrega duas vezes conta **uma vez** como pessoa. A função nova `resumoMutiraoDoPG()` faz isso com a mesma tolerância de identidade do resto do app: participante casa por `memberId` **ou** por nome, para que uma reentrada não transforme a mesma pessoa em duas.

---

# 4. Autoridade — verificada nos três papéis

| Quem está olhando | Vê A e C | Vê o formulário B |
|---|---|---|
| **Coordenador deste PG** | ✅ | ✅ |
| **Tutor** (de outro PG) | ✅ | ❌ — *"Só o Coordenador deste Pequeno Grupo registra entregas de colaboradores externos."* |
| **Participante comum** | ✅ | ❌ |

**A trava não é só visual.** Chamando `registrarEntregaExternaNatal()` diretamente pelo console, sem ser coordenador:

```
{ ok: false, motivo: "sem_autoridade" }
```

O formulário só aparece quando **o PG que está sendo visto é o PG da própria pessoa** — porque a gravação vincula a entrega ao PG do aparelho. Oferecer o formulário noutro contexto seria oferecer um botão que gravaria no lugar errado.

---

# 5. Validações testadas no formulário B

| Entrada | Resultado |
|---|---|
| Nome vazio | ❌ *"Informe o nome do colaborador externo."* — nada gravado |
| `1000` kg | ❌ *"Informe um valor entre 0,1 e 200 kg."* — nada gravado |
| `Joao Pereira` · `12` · `01/12/2026` | ✅ gravado |
| `Rita Alves` · `5,5` | ✅ gravado (vírgula decimal funciona) |

O campo de data já vem com **hoje** preenchido e **não aceita data futura** (`max` = hoje).

O registro gerado, conferido no banco:

```json
{ "tipoOrigem": "EXTERNO", "participante": null,
  "externo": { "nome": "Joao Pereira", "setor": null },
  "pgNum": 1, "data": "2026-12-05",
  "registradoPor": { "papel": "coordenador" } }
```

---

# 6. Sem regressão

| Bateria | Resultado |
|---|---|
| `autoTesteMutirao()` | **0 falhas de 30** |
| `autoTesteFase4()` | **0 falhas de 11** |
| `autoTesteE1()` | **0 falhas de 27** |
| **Total** | **68 testes, 0 falhas** |

Diff **141 inserções, 0 remoções** — nenhuma linha existente foi alterada.

---

# 7. ⚠️ Ressalvas honestas

## 7.1 🔴 Continua sem sincronizar — e agora é grave

O Coordenador registra os externos **no celular dele**. O Tutor, no aparelho dele, **não vê nada disso**. Cada aparelho enxerga só o que passou por ele.

Isso quer dizer que **o "Resumo do PG" ainda não é o resumo do PG** — é o resumo do que aquele aparelho conhece. Para a campanha funcionar de verdade, a decisão **Opção 1 × Opção 2** precisa sair.

## 7.2 Não há campo de setor para o externo

Você pediu três campos (nome, quantidade, data) e implementei exatamente esses. Consequência: dois colaboradores externos com o **mesmo nome** contam como **uma pessoa só** em "Colaboradores externos mobilizados".

O contrato da FASE 1 já prevê `externo.setor` — basta um quarto campo para desempatar homônimos. **Quer incluir?**

## 7.3 As duas pendências anteriores continuam

- **Sem desfazer.** Nem o participante nem o coordenador conseguem corrigir um erro de digitação. A função `anularEntregaNatal()` está pronta e testada desde a FASE 2, só falta o botão.
- **`kgMax = 200`** continua sendo suposição minha.

## 7.4 Verificação com dados simulados

Em modo de teste não há inscrição real; os papéis foram forjados. O caminho real de um Coordenador autenticado no Painel só será exercitado no R2.

---

# 8. Situação

| | |
|---|---|
| FASE 0 · 1 · 2 · 3 · 4 · 5 | ✅ concluídas |
| Sincronização na nuvem | 🔴 **decisão Opção 1 × 2 — é o que falta para a campanha ser utilizável** |
| Botão de desfazer | ⏳ recomendado |
| Campo de setor do externo | ⏳ recomendado |
| `main` | 🔒 intocada em `1aafe63` |
| Produção | 🔒 nenhuma escrita |
