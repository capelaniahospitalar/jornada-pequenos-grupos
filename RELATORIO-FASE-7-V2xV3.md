# FASE 7 — RELATÓRIO DE DIVERGÊNCIAS v2 × v3

> **Etapa 1 concluída: implementação paralela e diagnóstico.**
> O v3 **não** é oficial, **não** aparece em nenhuma tela e **não** foi publicado.
> O ranking que Tutores e Coordenadores veem continua sendo o v2, inalterado.

**Data:** 18/08/2026 · **Leitura congelada:** `updateTime` `2026-08-18T16:22:43.837198Z`
**Base:** produção após a consolidação do PG 6 — a mesma do `BASELINE-F7-PRE-IMPLEMENTACAO.md`

---

## 1. As quatro travas — cumpridas

| Trava | Como foi cumprida |
|---|---|
| Não alterar o motor v2 | **206 inserções, zero deleções** no `index.html`. Nenhuma linha existente tocada. |
| Não alterar o ranking exibido | `renderRankingPgs` intocada. Nenhuma tela chama o v3. |
| Não alterar Firestore/produção | Somente leitura. `updateTime` inalterado. Teste em servidor local, modo isolado. |
| Não promover o v3 | Sem flag de ativação, sem entrada de menu, sem chamada de tela. |

Os **três motores convivem**: `classificarPgs` (v1, legado), `classificarPgsV2` (oficial),
`classificarPgsV3` (experimental). Nada removido, nenhuma limpeza de legado.

**Leitura congelada por construção:** `compararMotoresRankingV2xV3()` roda os dois motores **no
mesmo bloco síncrono**, sobre o mesmo `PEQUENOS_GRUPOS`. Como o JavaScript é single-threaded e toda
sincronização é assíncrona, nenhuma gravação pode entrar no meio. É a resposta direta ao salto
54 → 56 de hoje. **Verificado:** dois cálculos consecutivos produzem resultado idêntico.

---

## 2. O v3 reproduz o baseline — critério de aceitação atendido

| | Baseline F7 | v3 calculado | |
|---|---|---|---|
| Classificados | 24 | **24** | ✅ |
| Em medição | 15 | **15** | ✅ |
| Não classificáveis | 11 | **11** | ✅ |
| Medíveis (classificados) | 153 | **153** | ✅ |
| Com evidência (classificados) | 36 | **36** | ✅ |
| Pódio | 56 · 51 · 43 | **56 · 51 · 43** | ✅ |

Testes de propriedade da fórmula, medidos sobre o código implementado:

| Teste | Resultado |
|---|---|
| Determinismo (dois cálculos no mesmo tick) | **idêntico** |
| TA-11 — cartão reconstrói a nota a partir das 4 dimensões | **sim, nos 24** |
| TA-08 — pessoa sem evidência aumenta a nota? | **0** (nunca aumenta) |
| TA-09 — invariância de escala | **0** de diferença |

---

## 3. Pódio: v2 × v3

| | v2 (oficial hoje) | v3 (experimental) |
|---|---|---|
| 1º | **FORTALEZA — 78** | **Serviço social — 56** |
| 2º | Serviço social — 55 | PG - Capelania — 51 |
| 3º | Conta as Bênçãos — 46 | Deus é minha fortaleza P1 — 43 |
| Classificados | **50** | **24** |

---

## 4. Comparação por PG — os 24 classificados no v3

| Pos v3 | PG | Eleg | Evid | Abr | Env | Mis | Prof | IMD v2 | IMD v3 | Dif | Pos v2 → v3 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 6 Serviço social | 7 | 5 | 71 | 38 | 57 | 27 | 55 | **56** | +1 | 2 → **1** |
| 2 | 1 PG - Capelania | 4 | 3 | 75 | 25 | 25 | 37 | 37 | **51** | **+14** | 4 → **2** |
| 3 | 12 Deus é minha fortaleza P1 | 4 | 3 | 60 | 33 | 20 | 19 | 31 | **43** | **+12** | 6 → **3** |
| 4 | 8 Gestão de almas | 10 | 6 | 55 | 18 | 45 | 25 | 30 | **41** | **+11** | 7 → **4** |
| 5 | 24 CONEXÃO REAL | 6 | 3 | 50 | 56 | 0 | 14 | 37 | 40 | +3 | 5 → 5 |
| 6 | 40 Conta as Bênçãos | 5 | 2 | 40 | 53 | 20 | 19 | 46 | 38 | **−8** | **3 → 6** |
| 7 | 5 Manutenção da Fé | 9 | 3 | 33 | 22 | 11 | 12 | 19 | 25 | +6 | 8 → 7 |
| 8 | 16 Lugar de Transformação | 3 | 1 | 33 | 0 | 33 | 23 | 19 | 24 | +5 | 9 → 8 |
| 9 | 2 Foco no alto | 4 | 1 | 25 | 8 | 25 | 29 | 17 | 21 | +4 | 11 → 9 |
| 10 | 15 DEUS SALVA VIDA | 4 | 1 | 25 | 0 | 25 | 15 | 14 | 18 | +4 | 13 → 10 |
| 11 | 34 Beta | 6 | 1 | 17 | 11 | 33 | 22 | 17 | 18 | +1 | 12 → 11 |
| 12 | 17 Maranata | 12 | 2 | 17 | 6 | 17 | 26 | 19 | 15 | **−4** | **10 → 12** |
| 13 | 4 Multibençãos | 12 | 2 | 15 | 10 | 8 | 28 | 9 | 14 | +5 | 15 → 13 |
| 14 | 42 Autorizados por Deus | 6 | 1 | 17 | 0 | 17 | 19 | 10 | 13 | +3 | 14 → 14 |
| 15 | 29 Ide | 8 | 1 | 13 | 4 | 13 | 4 | 8 | 10 | +2 | 17 → 15 |
| 16 | 21 Recepcionando Vidas | 8 | 1 | 13 | 0 | 13 | 11 | 8 | 10 | +2 | 18 → 16 |
| 17 | 23 DIAGNOSTICO DE ESPERANÇA | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 19 → 17 |
| 18 | 9 PÃO DA VIDA | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 19 → 18 |
| 19 | 10 Primícias | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 19 → 19 |
| 20 | 3 Higienização plantão B | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 19 → 20 |
| 21 | 46 HEMOGLOBINA ESPIRITUAL | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 19 → 21 |
| 22 | 18 Amigos | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 19 → 22 |
| 23 | 19 Farol | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 19 → 23 |
| 24 | 37 Plantão noite A | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 19 → 24 |

**Padrão das divergências:** quem **sobe** são PGs com boa cobertura que o v2 punia por não registrar
reunião (Capelania +14, Deus é minha fortaleza +12, Gestão de almas +11). Quem **desce** são os que
tinham nota apoiada em Regularidade — Conta as Bênçãos (−8, tinha 100 de Regularidade por *não ter
dia de reunião cadastrado*) e Maranata (−4).

---

## 5. Os 26 PGs que saem do ranking no v3

| Motivo | Qtd | PGs |
|---|---|---|
| Sem participantes | 10 | 7, 11, 13, 26, 28, 32, 35, 38, 45, 48 |
| Status = LIVRE | 1 | 50 |
| Menos de 3 fora da carência | 15 | 14, 20, 22, 25, 27, 30, 31, 33, 36, 39, **41**, 43, 44, 47, **49** |

Os 24 PGs que o v2 empatava na 19ª posição com nota 0 e percentil 62% deixam de existir como
categoria: ou são medidos de verdade, ou estão declaradamente sem base.

---

## 6. Casos obrigatórios

| Caso | v2 | v3 |
|---|---|---|
| **41 FORTALEZA** | **1º lugar, 78**, categoria "Baixo Engajamento" | **Em medição** — 1 de 3 fora da carência. Sem posição, sem nota. |
| **49 Limpando corações** | 16º, 9, **"Não Engajado"** | **Em medição** — 0 de 8 fora da carência. Não é rotulado como não engajado. |
| **6 Serviço social** | 2º, 55, Engajado | **1º**, 56, Engajado — 7 elegíveis, 5 com evidência |
| **1 PG - Capelania** | 4º, 37, "Baixo Engajamento" | **2º**, 51, **Altamente Engajado** |
| **12 Deus é minha fortaleza** | 6º, 31, "Baixo Engajamento" | **3º**, 43, Engajado |

O caso FORTALEZA está resolvido nos dois sentidos: ele sai do topo, e o PG 49 deixa de ser rotulado
injustamente.

### Comportamento por tamanho de população elegível

| Elegíveis | PG | Abrangência | IMD v3 | Posição |
|---|---|---|---|---|
| 3 | 16 Lugar de Transformação | 33 | 24 | 8º |
| 3 | 19 Farol · 37 Plantão noite A | 0 | 0 | 23º · 24º |
| 4 | **1 PG - Capelania** | **75** | **51** | **2º** |
| 4 | 2 Foco no alto | 25 | 21 | 9º |
| 5 | 40 Conta as Bênçãos | 40 | 38 | 6º |
| 6 | 24 CONEXÃO REAL | 50 | 40 | 5º |
| 7 | **6 Serviço social** | **71** | **56** | **1º** |
| 8 | 29 Ide · 21 Recepcionando | 13 | 10 | 15º · 16º |
| 9 | 5 Manutenção da Fé | 33 | 25 | 7º |
| 10 | 8 Gestão de almas | 55 | 41 | 4º |
| 12 | 17 Maranata · 4 Multibençãos | 17 · 15 | 15 · 14 | 12º · 13º |

**O tamanho não determina a posição.** Um PG de 4 elegíveis está em 2º; um de 12 está em 12º. Dentro
de cada faixa de tamanho há PGs no topo e na base — a posição segue a cobertura, não o tamanho.

---

## 7. Observações para a Fase 8

1. **Categoria × posição.** O 1º lugar (Serviço social, Abrangência 71) é "Engajado" enquanto o 2º
   (Capelania, Abrangência 75) é "Altamente Engajado". É o desenho homologado — posição vem da nota
   ponderada, categoria só da Abrangência. Conforme já registrado, o cartão precisará apresentar
   **"Posição no ranking"** e **"Nível de abrangência"** como informações distintas.
2. **PG em medição não exibe categoria.** O v3 já devolve `categoriaV3: null` para eles — FORTALEZA
   e PG 49 não recebem rótulo algum. Implementado conforme a observação do baseline.
3. **Uma inclusão a confirmar:** o `estadoPgV3` herda do v2 a exclusão de PGs de teste
   (`isPgDeTeste`), que a especificação da Fase 6 não menciona explicitamente. **Não afeta o
   baseline** (zero PGs de teste em produção), mas está sinalizado aqui para veto ou confirmação de
   vocês — foi a única decisão de implementação que ultrapassou a letra da especificação.
4. **Nada de UI foi construído.** A Fase 8 precisará decidir onde e como exibir a comparação e,
   depois, o v3 promovido.

---

*Etapa 1 da Fase 7 encerrada. Nenhuma promoção, nenhuma publicação, nenhuma escrita em produção.*
