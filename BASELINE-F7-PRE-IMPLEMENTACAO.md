# BASELINE F7 — PRÉ-IMPLEMENTAÇÃO *(HISTÓRICO — janela aberta)*

> ## 📁 DOCUMENTO HISTÓRICO — NÃO É MAIS O BASELINE DE ENTRADA DA FASE 7
>
> Este retrato foi levantado sob a **janela aberta** (evidência de qualquer época), regra vigente
> antes da **Emenda 1** da Fase 6. A Fase 6.6 restringiu a evidência ao ciclo mensal.
>
> **Preservado sem edição, para rastreabilidade.** O baseline de entrada da implementação do v3
> passa a ser o levantado sob a janela mensal — ver `BASELINE-F7-CICLO-MENSAL.md`.

> Este retrato substituiu, por sua vez, o baseline da Fase 6 (24 classificados / 154 medíveis /
> 36 com evidência / pódio 51-49-43), que já era **histórico da base anterior à correção do PG 6**.

**Natureza desta operação:** somente leitura. Nenhum código alterado, nenhuma escrita no Firestore,
nenhuma configuração tocada. Calculado fora do app, em modo de teste isolado, sobre cópia em memória.

| | |
|---|---|
| Data/hora do retrato | 18/08/2026 |
| `updateTime` do documento | **`2026-08-18T16:22:43.837198Z`** |
| Algoritmo | especificação homologada da Fase 6 (pesos 50/25/15/10 · ≥3 critérios/pessoa · ≥3 elegíveis/PG) |
| Base | produção, **após** a consolidação e o tombstone do PG 6 |
| Ciclo | mês-calendário · mês corrente `2026-08` |

**Integridade da migração do PG 6, reverificada neste retrato:** tombstone intacto (`removed: true`)
· histórico de Embaixadores de julho preservado no registro vivo. ✅

---

## 1. Totais do sistema

| Indicador | Valor |
|---|---|
| Total de PGs (slots) | **50** |
| Registros de participante (inclui tombstones) | **200** |
| Participantes **ativos** | **194** |
| **Elegíveis** (ativos, sem duplicata, fora da carência de 7 dias) | **165** |
| **Medíveis** (elegíveis + em carência que já têm evidência) — todos os PGs | **171** |
| Pessoas **com evidência** (≥3 dos 6 critérios) — todos os PGs | **40** |

### Dentro dos PGs classificados (a população que compete)

| Indicador | Valor |
|---|---|
| Medíveis | **153** |
| Com evidência | **36** |
| Taxa de conversão | **24%** |

---

## 2. Estados dos PGs

| Estado | Qtd |
|---|---|
| **CLASSIFICADO** (compete) | **24** |
| **EM MEDIÇÃO** (sem posição, sem nota) | **15** |
| **NÃO CLASSIFICÁVEL** (fora do ranking) | **11** |
| Soma | 50 ✔ |

### Não classificáveis — com motivo

| PG | Motivo |
|---|---|
| 7 Plantão B Hotelaria · 11 Conectados · 13 Plantão B Hotelaria · 26 Conexão · 28 Mãos que curam · 32 Manutenção da Fé · 35 Gama · 38 Foco no Alto · 45 Fortaleza · 48 Limpando corações | **sem participantes** (10 PGs) |
| 50 Nutrição | **status = LIVRE** |

### Em medição — com motivo

| PG | Ativos | Fora da carência | C/ evidência | Motivo |
|---|---|---|---|---|
| 14 Portaria de Deus - P3 | 2 | 2 | 0 | menos de 3 fora da carência |
| 20 Cristo Vive | 2 | 2 | 0 | menos de 3 fora da carência |
| 22 Farmácia da Cura | 1 | 1 | 0 | menos de 3 fora da carência |
| 25 Limpando corações | 1 | 1 | 0 | menos de 3 fora da carência |
| 27 Esperança VivA | 1 | 1 | 0 | menos de 3 fora da carência |
| 30 Auditoria pra Jesus | 1 | 1 | 0 | menos de 3 fora da carência |
| 31 Medicina | 3 | 1 | 0 | 2 dos 3 em carência |
| 33 Alfa | 1 | 1 | 0 | menos de 3 fora da carência |
| 36 Delta | 1 | 1 | 0 | menos de 3 fora da carência |
| 39 BÁLSAMO | 1 | 1 | 0 | menos de 3 fora da carência |
| **41 FORTALEZA** | 3 | **1** | 1 | 2 dos 3 em carência |
| 43 REFUGIO ILUMINADO | 1 | 1 | 0 | menos de 3 fora da carência |
| 44 MANÁ | 3 | 1 | 0 | 2 dos 3 em carência |
| 47 Diretoria | 1 | **0** | 0 | o único participante está em carência |
| **49 Limpando corações** | 8 | **0** | 3 | os 8 estão em carência |

---

## 3. Distribuição por categoria (entre os 24 classificados)

| Categoria | Qtd |
|---|---|
| Altamente Engajado (Abrangência ≥ 75) | **1** |
| Engajado (≥ 60) | **2** |
| Engajamento Moderado (≥ 40) | **3** |
| Baixo Engajamento (> 0) | **10** |
| Sem Evidência Registrada (= 0) | **8** |

---

## 4. Ranking completo — os 24 classificados

Legenda: **Abr** Abrangência · **Env** Envolvimento · **Mis** Missão · **Prof** Profundidade ·
**Eleg** elegíveis (fora da carência) · **Evid** com evidência · **Med** medíveis (denominador do cálculo)

| # | PG | IMD | Abr | Env | Mis | Prof | Eleg | Evid | Med | Categoria |
|---|---|---|---|---|---|---|---|---|---|---|
| **1** | **6 Serviço social** | **56** | 71 | 38 | 57 | 27 | 7 | 5 | 7 | Engajado |
| **2** | **1 PG - Capelania** | **51** | 75 | 25 | 25 | 37 | 4 | 3 | 4 | Altamente Engajado |
| **3** | **12 Deus é minha fortaleza P1** | **43** | 60 | 33 | 20 | 19 | 4 | 3 | 5 | Engajado |
| 4 | 8 Gestão de almas | 41 | 55 | 18 | 45 | 25 | 10 | 6 | 11 | Eng. Moderado |
| 5 | 24 CONEXÃO REAL | 40 | 50 | 56 | 0 | 14 | 6 | 3 | 6 | Eng. Moderado |
| 6 | 40 Conta as Bênçãos | 38 | 40 | 53 | 20 | 19 | 5 | 2 | 5 | Eng. Moderado |
| 7 | 5 Manutenção da Fé | 25 | 33 | 22 | 11 | 12 | 9 | 3 | 9 | Baixo Engajamento |
| 8 | 16 Lugar de Transformação | 24 | 33 | 0 | 33 | 23 | 3 | 1 | 3 | Baixo Engajamento |
| 9 | 2 Foco no alto | 21 | 25 | 8 | 25 | 29 | 4 | 1 | 4 | Baixo Engajamento |
| 10 | 15 DEUS SALVA VIDA | 18 | 25 | 0 | 25 | 15 | 4 | 1 | 4 | Baixo Engajamento |
| 11 | 34 Beta | 18 | 17 | 11 | 33 | 22 | 6 | 1 | 6 | Baixo Engajamento |
| 12 | 17 Maranata | 15 | 17 | 6 | 17 | 26 | 12 | 2 | 12 | Baixo Engajamento |
| 13 | 4 Multibençãos | 14 | 15 | 10 | 8 | 28 | 12 | 2 | 13 | Baixo Engajamento |
| 14 | 42 Autorizados por Deus | 13 | 17 | 0 | 17 | 19 | 6 | 1 | 6 | Baixo Engajamento |
| 15 | 29 Ide | 10 | 13 | 4 | 13 | 4 | 8 | 1 | 8 | Baixo Engajamento |
| 16 | 21 Recepcionando Vidas | 10 | 13 | 0 | 13 | 11 | 8 | 1 | 8 | Baixo Engajamento |
| 17 | 23 DIAGNOSTICO DE ESPERANÇA | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 8 | Sem Evidência Registrada |
| 18 | 9 PÃO DA VIDA | 0 | 0 | 0 | 0 | 0 | 7 | 0 | 7 | Sem Evidência Registrada |
| 19 | 10 Primícias | 0 | 0 | 0 | 0 | 0 | 7 | 0 | 7 | Sem Evidência Registrada |
| 20 | 3 Higienização plantão B | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 5 | Sem Evidência Registrada |
| 21 | 46 HEMOGLOBINA ESPIRITUAL | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 5 | Sem Evidência Registrada |
| 22 | 18 Amigos | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 4 | Sem Evidência Registrada |
| 23 | 19 Farol | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 3 | Sem Evidência Registrada |
| 24 | 37 Plantão noite A | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 3 | Sem Evidência Registrada |

**Notas de desempate observadas:** posições 10 e 11 empatam em 18 e são separadas pela Abrangência
(25 × 17); posições 15 e 16 empatam em 10 com a mesma Abrangência (13) e são separadas pelo
Envolvimento (4 × 0). O desempate homologado funcionou nos dois casos, sem sorteio.

---

## 5. Os três casos obrigatórios

### 5.1 PG 41 "FORTALEZA" — caso de regressão permanente

```
registros 3 · ativos 3 · fora da carência 1 · medíveis 1 · com evidência 1
Abr 100 · Env 100 · Mis 100 · Prof 26  →  nota que teria: 93
ESTADO: EM MEDIÇÃO — sem posição, sem nota publicada
Motivo: apenas 1 de 3 participantes fora da carência (mínimo 3)
```

**Este é o teste que qualquer implementação do v3 tem de passar.** Note que a nota que ele *teria* é
**93** — mais alta que o 1º lugar real. É o piso de 3 elegíveis, e somente ele, que o mantém fora.

### 5.2 PG 49 "Limpando corações" — caso-espelho

```
registros 8 · ativos 8 · fora da carência 0 · medíveis 3 · com evidência 3
Abr 100 · Env 56 · Mis 0 · Prof 9  →  nota que teria: 65
ESTADO: EM MEDIÇÃO — sem posição, sem nota publicada
Motivo: nenhum dos 8 participantes completou 7 dias
```

Entra no ranking sozinho quando a carência vencer, sem nenhuma intervenção. Não pode aparecer
rotulado como "Não Engajado" — é o erro do algoritmo atual que a Fase 6 corrigiu.

### 5.3 PG 6 "Serviço social" — corrigido, agora 1º lugar

```
registros 9 (inclui 1 tombstone) · ativos 8 · fora da carência 7 · medíveis 7 · com evidência 5
Abr 71 · Env 38 · Mis 57 · Prof 27  →  IMD 56
ESTADO: CLASSIFICADO — 1º lugar · Engajado
```

---

## 6. Duas observações que a Fase 7 precisa levar em conta

### 6.1 A base é viva — o IMD do PG 6 mudou durante esta sessão

Na validação da migração (15:47 UTC) o PG 6 marcava **54**. Neste retrato (16:22 UTC) marca **56**.

**Causa, verificada:** a participante Ana Gabrielle confirmou os **Embaixadores de Agosto** às 13:22
(BRT), elevando a Missão de 3/7 para 4/7 — de 43 para 57. Atividade legítima de usuário, sem relação
com a migração.

**Consequência metodológica:** um baseline só é comparável com o `updateTime` ao lado. A comparação
v2 × v3 da Fase 7 tem de rodar **sobre a mesma leitura do documento**, nunca sobre duas leituras
feitas em momentos diferentes. E é exatamente por isso que o **retrato mensal congelado** homologado
no ciclo é indispensável.

### 6.2 O 1º lugar tem categoria menor que o 2º — e isso é consequência do desenho, não defeito

| Posição | PG | IMD | Abrangência | Categoria |
|---|---|---|---|---|
| 1º | 6 Serviço social | **56** | 71 | Engajado |
| 2º | 1 PG - Capelania | 51 | **75** | **Altamente Engajado** |

A posição vem da **nota ponderada**; a categoria vem **só da Abrangência**. O PG 1 tem cobertura
maior, mas o PG 6 vence no conjunto (Missão 57 × 25, e mais gente medida).

Não é bug: é o que a especificação homologada determina. Mas é a versão suave do achado **A-03** da
Fase 1 — "nota alta e categoria menor no mesmo cartão" — e vai aparecer no cartão publicado.

**Isto não é uma proposta de reabrir a matemática.** É o registro de um fato observável, para que
vocês decidam se ele se qualifica como a "inconsistência objetiva" que a homologação previu como
única causa legítima de revisão. Se não se qualificar, a Fase 7 implementa como está.

**Sugestão de exibição, sem tocar no cálculo:** PGs em medição não devem exibir categoria. Neste
retrato, FORTALEZA e PG 49 calculam "Altamente Engajado" (Abrangência 100) — exibir isso ao lado de
"sem posição" seria confuso. A especificação já dizia "sem posição e sem nota"; vale acrescentar
**"e sem categoria"**.

---

## 7. Critério de aceitação para a Fase 7

O motor v3, implementado sobre a **mesma leitura** do documento (`updateTime`
`2026-08-18T16:22:43.837198Z`), deve reproduzir **exatamente**:

- 24 classificados · 15 em medição · 11 não classificáveis
- 153 medíveis e 36 com evidência entre os classificados
- as 24 linhas do ranking da seção 4, com os quatro componentes idênticos
- FORTALEZA e PG 49 sem posição
- PG 6 em 1º com 56, PG 1 em 2º com 51, PG 12 em 3º com 43

Qualquer divergência é defeito de implementação, não de especificação — a especificação está
homologada e fechada.

---

*Baseline levantado por leitura apenas. Nenhuma alteração de código, dado ou configuração. A Fase 7
não foi iniciada.*
