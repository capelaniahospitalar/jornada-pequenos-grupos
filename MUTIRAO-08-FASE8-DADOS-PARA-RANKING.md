# MUTIRÃO DE NATAL 2026 · FASE 8 — Dados brutos para o ranking

**Data:** 2026-09-08 · **Base:** `b89e606` (FASE 7 commitada) · **Status:** ✅ implementada e verificada
**Alteração:** `index.html` — **86 inserções, 16 remoções.** As 16 remoções são linhas trocadas no lugar (§4).

---

# 1. O registro de dados brutos

Uma função, `dadosMutiraoDoPG(pgNum)`, devolve por PG:

```json
{
  "pgNum": 1,
  "edicao": "2026",

  "totalKg": 21,
  "kgParticipantes": 15,
  "kgExternos": 6,

  "participantesQueEntregaram": 2,
  "colaboradoresExternosMobilizados": 2,
  "totalPessoasMobilizadas": 4,

  "totalEntregasParticipantes": 3,
  "totalEntregasExternas": 3
}
```

| Campo | Origem |
|---|---|
| `totalKg` · `participantesQueEntregaram` · `colaboradoresExternosMobilizados` · `totalPessoasMobilizadas` | **pedidos por você** |
| `totalEntregasParticipantes` · `totalEntregasExternas` | pedidos como *"se necessário"* — **incluí**, e §3 mostra por quê são necessários |
| `kgParticipantes` · `kgExternos` | já eram usados pelo Dashboard da FASE 7 (tabela "Origem dos kg") |
| `pgNum` · `edicao` | identificam de quem e de qual campanha é o registro — sem isso, dois registros soltos não se distinguem |

---

# 2. ⚠️ Nenhuma fórmula — e um teste que garante isso

Você pediu para não criar fórmula de ranking antes de homologar a regra matemática. Não criei. E não deixei isso só na promessa:

**O teste M-48 falha se qualquer campo calculado entrar no registro.** Ele compara as chaves devolvidas com a lista declarada e acusa qualquer intruso — um "score", um "índice", um peso. Se um dia alguém (eu, numa fase futura) tentar embutir uma nota aqui, o teste fica vermelho.

O comentário no código diz a mesma coisa, em português: *"Se um dia alguém quiser somar, pesar ou dividir estes números, que faça em outra função: esta não."*

---

# 3. Pessoa ≠ entrega — a distinção que o ranking vai precisar

O cenário de teste foi montado de propósito para que os dois números **não coincidam em nenhum dos dois lados**:

| Quem | Entregas | Pessoas |
|---|---|---|
| Maria 6 kg + 4 kg · Carla 5 kg | **3** | **2** |
| João 3 kg + 2 kg · Rita 1 kg | **3** | **2** |

```
participantesQueEntregaram        = 2      totalEntregasParticipantes = 3
colaboradoresExternosMobilizados  = 2      totalEntregasExternas      = 3
totalPessoasMobilizadas           = 4
```

Sem os dois campos de entregas, "3 entregas de 2 pessoas" e "2 entregas de 2 pessoas" ficariam indistinguíveis — e um ranking que quisesse premiar **constância** (quantas vezes) em vez de **alcance** (quantas pessoas) não teria como. Por isso não deixei esse "se necessário" de fora: **eles são baratos de guardar e impossíveis de recuperar depois.**

---

# 4. Uma função, não duas

`resumoMutiraoDoPG()` (FASE 5) **virou** `dadosMutiraoDoPG()`, com os nomes que você especificou. Não criei uma função nova ao lado da antiga.

**Por quê:** duas funções calculando os mesmos números seriam dois caminhos para a mesma verdade, e um dia divergiriam. É o mesmo cuidado que registrei na FASE 7 sobre o Dashboard não fazer conta própria.

**O que isso obrigou a mexer:** o Dashboard, único consumidor, passou a ler `r.totalKg` em vez de `r.total`, e assim por diante. Conferi que **não sobrou nenhuma referência** ao nome antigo nem aos campos antigos no arquivo inteiro.

As 16 linhas removidas no diff são exatamente essas trocas — nenhuma funcionalidade saiu.

---

# 5. Verificação

## 5.1 Testes

**8 testes novos** (M-42 a M-49), todos passando:

```
OK  M-42 o registro traz todos os campos do contrato   [todos presentes]
OK  M-43 totalKg correto                               [21]
OK  M-44 quilos por origem somam o total               [15 + 6]
OK  M-45 PESSOAS: quem entregou 2x conta 1 vez         [2 / 2]
OK  M-46 ENTREGAS: a mesma pessoa conta 2 vezes        [3 / 3]
OK  M-47 totalPessoasMobilizadas soma os dois lados    [4]
OK  M-48 nenhum campo calculado além do contrato       [nenhum]
OK  M-49 PG sem entregas devolve zeros, não vazio
```

| Bateria | Resultado |
|---|---|
| `autoTesteMutirao()` | **0 falhas de 49** |
| `autoTesteFase4()` | **0 falhas de 11** |
| `autoTesteE1()` | **0 falhas de 27** |
| **Total** | **87 testes, 0 falhas** |

## 5.2 Nada quebrou na tela

| | |
|---|---|
| Dashboard do PG | `21 kg` · `2 participantes entregaram` · `2 colaboradores externos entregaram` · tabela `15 + 6 = 21` ✅ |
| Tela do participante | Maria vê `10 kg` seus (6+4) e `21 kg` do PG ✅ |
| Referências ao nome antigo | **zero** no arquivo ✅ |

## 5.3 PG sem nenhuma entrega

Devolve **zeros**, não `null` nem objeto vazio — quem for calcular o ranking não vai tropeçar em campo ausente:

```json
{ "totalKg": 0, "kgParticipantes": 0, "kgExternos": 0,
  "participantesQueEntregaram": 0, "colaboradoresExternosMobilizados": 0,
  "totalPessoasMobilizadas": 0,
  "totalEntregasParticipantes": 0, "totalEntregasExternas": 0 }
```

---

# 6. ⚠️ O que este registro NÃO garante

## 6.1 🔴 Ele só existe para o PG deste aparelho

`dadosMutiraoDoPG(pgNum)` responde por **qualquer** número de PG — mas responde a partir do que está **neste celular**. Como não há sincronização, para todos os outros PGs ele devolve **zeros**, e para o próprio PG devolve só as entregas que passaram por este aparelho.

**Não construí uma função "dados de todos os PGs" de propósito.** Ela produziria hoje uma tabela de zeros com um PG preenchido, e isso pareceria um ranking. Enquanto não houver sincronização, **não existe dado consolidado por PG** — e é isso, não a fórmula, que separa o Mutirão de ter ranking.

## 6.2 `totalPessoasMobilizadas` soma sem cruzar

É a soma direta dos dois lados. Se o Coordenador digitar como "externo" o nome de alguém que também é participante do PG, a pessoa conta duas vezes. Não é erro de cálculo — é erro de digitação, e o app não tem como saber. Só apontando para você saber que existe.

## 6.3 As pendências de sempre

| | |
|---|---|
| 🔴 **Sincronização** | decisão Opção 1 × Opção 2 |
| **Botão de desfazer** | motor pronto desde a FASE 2, falta o botão |
| **`kgMax = 200`** | continua sendo suposição minha |
| **Campo de setor do externo** | desempataria homônimos |
| **Verificação com dados simulados** | o caminho real só no R2 |

---

# 7. Situação

| | |
|---|---|
| FASE 0 → 8 | ✅ todas concluídas |
| Fórmula do ranking | ⏸️ **intencionalmente não iniciada** — aguarda homologação da regra matemática |
| Dados brutos | ✅ preservados, testados e protegidos contra contaminação por fórmula |
| Consolidação entre PGs | 🔴 impossível sem sincronização |
| `main` | 🔒 intocada em `1aafe63` |
| Produção | 🔒 nenhuma escrita |
