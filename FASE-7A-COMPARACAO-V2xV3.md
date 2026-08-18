# FASE 7A — COMPARAÇÃO PARALELA v2 × v3

> **Somente leitura.** Sem commit, sem publicação, sem alteração do v2, do Firestore, da fórmula,
> dos pesos ou das categorias. Mudança B congelada. **O v3 continua não homologado.**

**Leitura única congelada:** `updateTime` `2026-08-18T16:22:43.837198Z` · ciclo `2026-08`
**Método:** v2, v3 (com janela) e v3 (sem janela, diagnóstico) calculados **no mesmo bloco síncrono**,
sobre a mesma leitura. Nenhuma gravação pode ter entrado no meio.

---

## 1. Tabela completa — os 24 PGs classificados

| # v3 | PG | v2 | v3 | Δ | pos v2→v3 | Categoria v2 | Categoria v3 | Capilaridade | Alcance | Env | Prof |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 6 Serviço social | 55 | **56** | +1 | 2→1 | Engajado | Engajado | 71% (5/7) | **5** | 38 | 27 |
| 2 | 1 PG - Capelania | 37 | **51** | **+14** | 4→2 | Baixo Engajamento | **Altamente Engajado** | 75% (3/4) | 3 | 25 | 37 |
| 3 | 12 Deus é minha fortaleza P1 | 31 | **43** | **+12** | 6→3 | Baixo Engajamento | **Engajado** | 60% (3/5) | 3 | 33 | 19 |
| 4 | 8 Gestão de almas | 30 | **41** | **+11** | 7→4 | Baixo Engajamento | **Eng. Moderado** | 55% (6/11) | **6** | 18 | 25 |
| 5 | 40 Conta as Bênçãos | 46 | 38 | **−8** | 3→5 | Eng. Moderado | Eng. Moderado | 40% (2/5) | 2 | 53 | 19 |
| 6 | 16 Lugar de Transformação | 19 | 24 | +5 | 9→6 | Baixo Engajamento | Baixo Engajamento | 33% (1/3) | 1 | 0 | 23 |
| 7 | 2 Foco no alto | 17 | 21 | +4 | 11→7 | Baixo Engajamento | Baixo Engajamento | 25% (1/4) | 1 | 8 | 29 |
| 8 | 15 DEUS SALVA VIDA | 14 | 18 | +4 | 13→8 | Baixo Engajamento | Baixo Engajamento | 25% (1/4) | 1 | 0 | 15 |
| 9 | 34 Beta | 17 | 18 | +1 | 12→9 | Baixo Engajamento | Baixo Engajamento | 17% (1/6) | 1 | 11 | 22 |
| 10 | 24 CONEXÃO REAL | 37 | 15 | **−22** | 5→10 | Eng. Moderado | **Baixo Engajamento** | 17% (1/6) | 1 | 17 | 19 |
| 11 | 17 Maranata | 19 | 15 | −4 | 10→11 | Baixo Engajamento | Baixo Engajamento | 17% (2/12) | 2 | 6 | 26 |
| 12 | 4 Multibençãos | 9 | 14 | +5 | 15→12 | Baixo Engajamento | Baixo Engajamento | 15% (2/13) | 2 | 8 | 28 |
| 13 | 42 Autorizados por Deus | 10 | 13 | +3 | 14→13 | Baixo Engajamento | Baixo Engajamento | 17% (1/6) | 1 | 0 | 19 |
| 14 | 29 Ide | 8 | 10 | +2 | 17→14 | Baixo Engajamento | Baixo Engajamento | 13% (1/8) | 1 | 4 | 4 |
| 15 | 21 Recepcionando Vidas | 8 | 10 | +2 | 18→15 | Baixo Engajamento | Baixo Engajamento | 13% (1/8) | 1 | 0 | 11 |
| 16 | 5 Manutenção da Fé | 19 | 9 | **−10** | 8→16 | Baixo Engajamento | Baixo Engajamento | 11% (1/9) | 1 | 0 | 15 |
| 17 | 23 DIAGNOSTICO DE ESPERANÇA | 0 | 0 | 0 | 19→17 | Não Engajado | Sem Evidência Registrada | 0% (0/8) | 0 | 0 | 0 |
| 18 | 9 PÃO DA VIDA | 0 | 0 | 0 | 19→18 | Não Engajado | Sem Evidência Registrada | 0% (0/7) | 0 | 0 | 0 |
| 19 | 10 Primícias | 0 | 0 | 0 | 19→19 | Não Engajado | Sem Evidência Registrada | 0% (0/7) | 0 | 0 | 0 |
| 20 | 3 Higienização plantão B | 0 | 0 | 0 | 19→20 | Não Engajado | Sem Evidência Registrada | 0% (0/5) | 0 | 0 | 0 |
| 21 | 46 HEMOGLOBINA ESPIRITUAL | 0 | 0 | 0 | 19→21 | Não Engajado | Sem Evidência Registrada | 0% (0/5) | 0 | 0 | 0 |
| 22 | 18 Amigos | 0 | 0 | 0 | 19→22 | Não Engajado | Sem Evidência Registrada | 0% (0/4) | 0 | 0 | 0 |
| 23 | 19 Farol | 0 | 0 | 0 | 19→23 | Não Engajado | Sem Evidência Registrada | 0% (0/3) | 0 | 0 | 0 |
| 24 | 37 Plantão noite A | 0 | 0 | 0 | 19→24 | Não Engajado | Sem Evidência Registrada | 0% (0/3) | 0 | 0 | 0 |

---

## 2. Classificação das diferenças

### 2.1 Mudança causada **exclusivamente** pela janela mensal

Isolada comparando v3-sem-janela × v3-com-janela, na mesma leitura. **Apenas dois PGs mudam de nota:**

| PG | Evidência | Abrangência | Envolvimento | Nota | Posição |
|---|---|---|---|---|---|
| **24 CONEXÃO REAL** | 3 → **1** | 50 → **17** | 56 → **17** | 40 → **15** *(−25)* | 5º → **10º** |
| **5 Manutenção da Fé** | 3 → **1** | 33 → **11** | 22 → **0** | 25 → **9** *(−16)* | 7º → **16º** |

Todos os demais 22 PGs mudam **apenas de posição, por deslocamento passivo** — nota idêntica.

**Leitura:** a janela é cirúrgica. Ela atinge exatamente os dois PGs cuja "evidência" era
majoritariamente de julho, e não toca em mais ninguém.

### 2.2 Mudança de nota (v2 → v3)

| Direção | PGs |
|---|---|
| **Sobem** | 1 Capelania **+14** · 12 Deus é minha fortaleza **+12** · 8 Gestão de almas **+11** · 16 e 4 (+5) · 2 e 15 (+4) · 42 (+3) · 29 e 21 (+2) · 6 e 34 (+1) |
| **Descem** | 24 CONEXÃO REAL **−22** · 5 Manutenção da Fé **−10** · 40 Conta as Bênçãos **−8** · 17 Maranata **−4** |
| **Inalterados** | os 8 PGs com nota 0 |

**Duas causas distintas, não confundir:**
- *Subiram* porque a **Regularidade saiu do cálculo** — eram PGs com boa cobertura que o v2 punia por não registrar reunião.
- *Desceram* por dois motivos diferentes: **Conta as Bênçãos e Maranata** perderam a Regularidade que os favorecia (a de Conta as Bênçãos vinha de *não ter dia de reunião cadastrado*); **CONEXÃO REAL e Manutenção da Fé** caíram pela **janela mensal**.

### 2.3 Mudança de categoria

**Substantivas (4):**

| PG | v2 | v3 |
|---|---|---|
| 1 Capelania | Baixo Engajamento | **Altamente Engajado** |
| 12 Deus é minha fortaleza | Baixo Engajamento | **Engajado** |
| 8 Gestão de almas | Baixo Engajamento | **Eng. Moderado** |
| 24 CONEXÃO REAL | Eng. Moderado | **Baixo Engajamento** |

**Renomeação (8):** todos os PGs sem evidência passam de **"Não Engajado"** para
**"Sem Evidência Registrada"** — mudança de significado exigida pelo critério V5.

### 2.4 Pódio

| | v2 (oficial hoje) | v3 |
|---|---|---|
| 1º | **FORTALEZA — 78** | **Serviço social — 56** |
| 2º | Serviço social — 55 | **PG - Capelania — 51** |
| 3º | Conta as Bênçãos — 46 | **Deus é minha fortaleza P1 — 43** |

**Entram:** Capelania e Deus é minha fortaleza. **Saem:** FORTALEZA (vai para "Em medição") e
Conta as Bênçãos (cai para 5º).

### 2.5 Entram / saem do ranking

**Saem 26 PGs:** 11 não classificáveis (10 sem participantes + 1 `LIVRE`) e 15 em medição.
**Entra 1:** PG 37 Plantão noite A (3 pessoas fora da carência), em 24º com nota 0.
Os 24 PGs que o v2 empatava em 19º com percentil 62% deixam de existir como categoria.

### 2.6 Casos extremos

| Caso | v2 | v3 |
|---|---|---|
| **41 FORTALEZA** | **1º lugar, 78**, rotulado "Baixo Engajamento" | **Em medição** — 1 de 3 fora da carência. Sem posição, sem nota, sem categoria |
| **49 Limpando corações** | 16º, 9, **"Não Engajado"** | **Em medição** — 0 de 8 fora da carência. Não recebe rótulo |
| **24 CONEXÃO REAL** | 5º, 37, Eng. Moderado | 10º, 15 — **maior queda do sistema (−22)**, inteiramente pela janela |
| **8 Gestão de almas** | 7º, 30 | 4º por capilaridade · **1º em alcance absoluto (6 pessoas)** |

---

## 3. Validade de construto — os cinco casos contra a realidade conhecida

| PG | O que o v3 diz | Confere com a realidade? |
|---|---|---|
| **6 Serviço social** | 1º · capil 71% (5/7) · alcance 5 · env 38 · prof 27 | ✅ as três leituras convergem — é o caso saudável de referência |
| **8 Gestão de almas** | 4º · capil 55% (6/11) · **alcance 6** · env 18 · prof 25 | ✅ o cartão mostra o que a nota sozinha esconderia: **o maior alcance do sistema** |
| **41 FORTALEZA** | fora do ranking, sem rótulo | ✅ "não há base para comparar", não "é ruim" |
| **49 Limpando corações** | fora do ranking, sem rótulo | ✅ deixa de ser injustamente chamado de "Não Engajado" |
| **1 PG - Capelania** | 2º · capil 75% (3/4) · alcance 3 · **env 25** · prof 37 | ⚠️ **parcialmente — ver §4** |

---

## 4. ⚠️ O achado que a Fase 7A traz para a decisão de homologação

**O PG Capelania é rotulado "Altamente Engajado".**

O Tutor do grupo descreve a realidade como *"praticamente somente eu interajo com o aplicativo"*.
E os próprios números do v3 confirmam essa descrição: **Envolvimento 25 — o mais baixo entre os seis
primeiros colocados**.

Ou seja: o cartão diz, ao mesmo tempo, **"Altamente Engajado"** e **"Envolvimento 25"**.

**Isto não é erro de cálculo.** A categoria deriva da Abrangência (75% ≥ 75), exatamente como
homologado. O problema é de **nome**:

> A categoria mede **capilaridade** — que proporção do grupo apresentou evidência — mas se chama
> **"Engajamento"**. São coisas diferentes, e a Fase 6.6 separou justamente essas duas.

Sob o v2 este mesmo PG era "Baixo Engajamento"; sob o v3 é "Altamente Engajado". O rótulo saltou de
um extremo ao outro sem que a vida do grupo tenha mudado — os dois rótulos descrevem **outra coisa**,
não o engajamento.

**Encaminhamento sugerido — não mexe em nenhuma conta:** renomear a escala de categorias para o que
ela de fato mede, por exemplo *Alta / Média / Baixa Capilaridade*, ou *Abrangência Alta / Moderada /
Baixa*. Os limiares (75 / 60 / 40) e toda a matemática permanecem intactos.

**Não implementei nada disso.** É decisão de vocês, e se qualifica como o tipo de achado que a
homologação previu — uma inconsistência entre o que o índice mede e o que o rótulo afirma.

---

## 5. Conclusão da Fase 7A

O que o novo modelo muda, em uma frase:

> **Ele deixa de premiar o registro de reuniões e a evidência histórica, e passa a premiar quantas
> pessoas do grupo caminharam dentro do mês — mostrando ao lado, sem escondê-los, o alcance
> absoluto, o envolvimento e a profundidade.**

**Nenhuma variável matemática não autorizada foi introduzida:** o v3 reproduz o baseline oficial
exatamente, e as 22 mudanças de posição sem mudança de nota são deslocamento passivo.

**Pendente para a decisão de homologação do v3:**
1. O nome das categorias (§4).
2. Se o pódio resultante — Serviço social · Capelania · Deus é minha fortaleza — corresponde ao que
   se conhece pastoralmente desses três grupos.

---

*Fase 7A encerrada. Somente leitura. O v3 permanece experimental, inerte, não commitado e não
publicado. Produção inalterada.*
