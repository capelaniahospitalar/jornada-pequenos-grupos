# BASELINE F7 — CICLO MENSAL

> ## ✅ BASELINE OFICIAL DA FASE 7 — FECHADO EM 18/08/2026
> **Ciclo mensal aplicado a todas as dimensões dependentes de atividade observável.**
>
> **Regra de especificação decidida:**
> *Toda atividade observável utilizada para calcular o IMD competitivo deve pertencer ao ciclo
> mensal vigente. Evidências e componentes de Envolvimento não podem incorporar atividade anterior
> ao ciclo.*
>
> | Dimensão | Janela |
> |---|---|
> | Abrangência | evidência **dentro do mês** |
> | Envolvimento | frentes efetivamente tocadas **dentro do mês** |
> | Missão | atividade de missão **dentro do mês** |
> | Profundidade | população filtrada pelo ciclo; métricas conforme a definição já homologada (ver §2.1) |
> | Histórico anterior | permanece armazenado para acompanhamento longitudinal, **não interfere** no IMD do ciclo |
>
> A variante "só evidência" (§4) fica preservada **apenas como análise comparativa** — não é regra.

**Data:** 18/08/2026 · **Substitui:** `BASELINE-F7-PRE-IMPLEMENTACAO.md` (janela aberta, agora histórico)
**Regra aplicada:** especificação da Fase 6 **com a Emenda 1** (janela do ciclo mensal)
**Natureza:** somente leitura. Nenhum código alterado, nenhuma escrita no Firestore.

---

## 1. Leitura única congelada

| | |
|---|---|
| `updateTime` do documento | **`2026-08-18T16:22:43.837198Z`** |
| Ciclo | mês-calendário · `2026-08` |
| Motor v2, motor v3 e ambas as variantes | calculados **no mesmo bloco síncrono**, sobre a mesma leitura |

**A trava que você pediu está cumprida por construção:** uma única chamada de rede, os dados fixados
em memória, e todos os cálculos executados no mesmo *tick* do JavaScript. Como toda sincronização do
app é assíncrona e o JavaScript é single-threaded, **nenhuma gravação pode entrar no meio**. Não há
"leitura das 10h comparada com a das 10h20".

---

## 2. Como a janela foi operacionalizada — e sua limitação

O modelo de dados **não permite datar cada critério individualmente**: o campo `contrib` guarda
apenas a última semana em que a pessoa agiu, não um histórico. Portanto a janela é aplicada **no
nível da pessoa**:

> Uma pessoa conta para o ciclo se `progresso.updatedAt` cai dentro do mês corrente, **ou** se
> confirmou os Embaixadores do mês.

É a melhor aproximação que o dado atual sustenta.

### 2.1 Limitação de granularidade temporal *(declarada, não é falha do algoritmo)*

O `contrib` não guarda histórico por critério. Portanto **não temos base de dados** para afirmar
*"esta pessoa fez estudo em agosto, oração em agosto, mas missão apenas em julho"*. Temos apenas a
melhor evidência temporal que o modelo atual oferece: **a pessoa esteve ativa dentro do ciclo**.

Duas consequências, ambas deliberadas:

1. **Não se cria janela independente por critério.** Uma janela por critério exigiria histórico por
   participante — mudança de modelo de dados, **fora do escopo desta fase**.
2. **A Profundidade mantém a definição homologada:** médias de estudos concluídos e sequência, que
   são medidas **acumuladas** por natureza, calculadas sobre uma população **já filtrada pelo
   ciclo** (só quem tem evidência no mês). Filtrar as próprias medidas exigiria o mesmo histórico
   inexistente.

Isto é registrado como **limitação de granularidade temporal do modelo de dados**, sob o critério
V2 (nenhum proxy silencioso) — não como defeito do índice.

---

## 3. Totais do sistema

| Indicador | Janela aberta *(histórico)* | **Ciclo mensal** |
|---|---|---|
| PGs classificados | 24 | **24** |
| Em medição | 15 | **15** |
| Não classificáveis | 11 | **11** |
| Medíveis (classificados) | 153 | **153** |
| **Com evidência** | 36 | **32** |
| Taxa de conversão | 24% | **21%** |

Os estados não mudam: dependem da carência e do piso de elegíveis, não da evidência.

---

## 4. A decisão pendente — as duas variantes

**Variante A — janela só na evidência.** Uma pessoa fora do ciclo não conta como "com evidência",
mas **seus registros antigos continuam contando para o Envolvimento**.

**Variante B — janela em tudo.** Uma pessoa fora do ciclo não conta nem para evidência nem para
Envolvimento.

### Onde as duas divergem

| PG | Envolvimento | IMD | Posição |
|---|---|---|---|
| **24 CONEXÃO REAL** | 56 → **17** | 24 → **15** | 7º → **10º** |
| **5 Manutenção da Fé** | 22 → **0** | 14 → **9** | 13º → **16º** |
| 4 Multibençãos | 10 → 8 | 14 → 14 | 12º → 12º |
| outros 6 PGs | — | — | deslocamento passivo de 1 posição |

**O pódio é idêntico nas duas variantes** (56 · 51 · 43), e os cinco primeiros não se movem. A
divergência começa no 6º lugar.

### Decisão tomada

> ### ✅ **VARIANTE B — janela em todas as dimensões.** Oficial desde 18/08/2026.

**Razão registrada — consistência interna:** se uma pessoa está fora do ciclo para determinar
evidência, mas suas atividades antigas continuam alimentando o Envolvimento, **estamos misturando
dois relógios dentro do mesmo IMD** — o que reintroduziria exatamente o problema temporal que a
Emenda 1 corrigiu.

O caso do PG 5 Manutenção da Fé é o mais claro: sob a variante A ele mantém Envolvimento 22 com
**uma única pessoa ativa no ciclo**; sob a B, cai a 0 — que é a leitura verdadeira.

A variante A permanece neste documento **apenas como análise comparativa**.

---

## 5. BASELINE OFICIAL — Variante B (ciclo mensal em todas as dimensões)

| # | PG | Eleg | Med | Evid | Abr | Env | Mis | Prof | **IMD** |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 6 Serviço social | 7 | 7 | 5 | 71 | 38 | 57 | 27 | **56** |
| 2 | 1 PG - Capelania | 4 | 4 | 3 | 75 | 25 | 25 | 37 | **51** |
| 3 | 12 Deus é minha fortaleza P1 | 4 | 5 | 3 | 60 | 33 | 20 | 19 | **43** |
| 4 | 8 Gestão de almas | 10 | 11 | 6 | 55 | 18 | 45 | 25 | **41** |
| 5 | 40 Conta as Bênçãos | 5 | 5 | 2 | 40 | 53 | 20 | 19 | **38** |
| 6 | 16 Lugar de Transformação | 3 | 3 | 1 | 33 | 0 | 33 | 23 | 24 |
| 7 | 2 Foco no alto | 4 | 4 | 1 | 25 | 8 | 25 | 29 | 21 |
| 8 | 15 DEUS SALVA VIDA | 4 | 4 | 1 | 25 | 0 | 25 | 15 | 18 |
| 9 | 34 Beta | 6 | 6 | 1 | 17 | 11 | 33 | 22 | 18 |
| 10 | 24 CONEXÃO REAL | 6 | 6 | 1 | 17 | 17 | 0 | 19 | 15 |
| 11 | 17 Maranata | 12 | 12 | 2 | 17 | 6 | 17 | 26 | 15 |
| 12 | 4 Multibençãos | 12 | 13 | 2 | 15 | 8 | 8 | 28 | 14 |
| 13 | 42 Autorizados por Deus | 6 | 6 | 1 | 17 | 0 | 17 | 19 | 13 |
| 14 | 29 Ide | 8 | 8 | 1 | 13 | 4 | 13 | 4 | 10 |
| 15 | 21 Recepcionando Vidas | 8 | 8 | 1 | 13 | 0 | 13 | 11 | 10 |
| 16 | 5 Manutenção da Fé | 9 | 9 | 1 | 11 | 0 | 11 | 15 | 9 |
| 17 | 23 DIAGNOSTICO DE ESPERANÇA | 8 | 8 | 0 | 0 | 0 | 0 | 0 | **0** |
| 18 | 9 PÃO DA VIDA | 7 | 7 | 0 | 0 | 0 | 0 | 0 | **0** |
| 19 | 10 Primícias | 7 | 7 | 0 | 0 | 0 | 0 | 0 | **0** |
| 20 | 3 Higienização plantão B | 5 | 5 | 0 | 0 | 0 | 0 | 0 | **0** |
| 21 | 46 HEMOGLOBINA ESPIRITUAL | 5 | 5 | 0 | 0 | 0 | 0 | 0 | **0** |
| 22 | 18 Amigos | 4 | 4 | 0 | 0 | 0 | 0 | 0 | **0** |
| 23 | 19 Farol | 3 | 3 | 0 | 0 | 0 | 0 | 0 | **0** |
| 24 | 37 Plantão noite A | 3 | 3 | 0 | 0 | 0 | 0 | 0 | **0** |

> **Correção documental (18/08, após a implementação do C3).** A versão anterior desta tabela
> agrupava estes oito PGs empatados em "17º". Estava **errada**: o script de diagnóstico que a
> gerou usava um desempate incompleto (só nota → Abrangência → Envolvimento). O desempate
> **homologado** continua até *nº de medíveis* e *menor número de PG*, o que os separa em 17º a 24º.
> A implementação do v3 está correta; o erro era do documento. Registrado, não substituído em
> silêncio.

**Alcance absoluto** (indicador separado, não entra na nota): PG 8 = **6** · PG 6 = 5 · PG 1, 12 = 3 ·
PG 17, 4, 40 = 2 · demais = 1 ou 0.

---

## 6. Comparação com o motor oficial v2 — mesma leitura

| | v2 (oficial hoje) | v3 sob ciclo mensal |
|---|---|---|
| 1º | **FORTALEZA — 78** | **Serviço social — 56** |
| 2º | Serviço social — 55 | PG - Capelania — 51 |
| 3º | Conta as Bênçãos — 46 | Deus é minha fortaleza P1 — 43 |
| PGs classificados | 50 | 24 |

---

## 7. Casos de regressão obrigatórios

| Caso | Estado sob o ciclo mensal |
|---|---|
| **41 FORTALEZA** | **Em medição** — 1 de 3 fora da carência. Sem posição, sem nota, sem categoria. |
| **49 Limpando corações** | **Em medição** — 0 de 8 fora da carência. Não é rotulado. |
| **1 PG - Capelania** | 2º — 3/4 · Abr 75 · Env 25 · Prof 37. **Inalterado pela janela**: os três agiram em agosto. |
| **6 Serviço social** | 1º — 5/7 · Abr 71 · Env 38 · Mis 57 |
| **8 Gestão de almas** | 4º por penetração · **1º por alcance absoluto** (6 pessoas) |

---

## 8. Critério de aceitação para o v3 adaptado

Uma vez decidida a variante e adaptado o motor, ele deve reproduzir **exatamente** esta tabela sobre
a mesma leitura (`updateTime` `2026-08-18T16:22:43.837198Z`): 24 classificados · 15 em medição ·
11 não classificáveis · 153 medíveis · 32 com evidência · pódio 56 · 51 · 43.

Qualquer divergência é defeito de implementação, não de especificação.

---

*Baseline levantado por leitura apenas. **Fechado em 18/08/2026** — é a referência oficial de entrada
da implementação do v3 e da comparação v2 × v3 da Fase 7.*
