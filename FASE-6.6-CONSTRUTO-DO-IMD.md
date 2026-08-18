# FASE 6.6 — DEFINIÇÃO DO CONSTRUTO DO IMD

> ## 📌 DECISÕES PRELIMINARES TOMADAS EM 18/08/2026
> As dez definições abaixo estão fechadas como posição do projeto. **A homologação formal está
> pendente** — e, até ela, permanece em vigor a regra: nenhuma alteração no motor v3, nenhuma
> alteração em produção, Fase 7 suspensa.

**Natureza:** documentação e análise. Nenhum código, nenhuma escrita no Firestore.
**Base das medições:** produção, `updateTime` `2026-08-18T16:22:43.837198Z`

---

## A regra de governança que organiza tudo

> ### **O ranking ordena os PGs; os indicadores explicam por que eles estão naquela posição.**

Essa frase resolve a tensão central da auditoria. O IMD deixa de ter que responder sozinho a todas as
perguntas sobre a vida do Pequeno Grupo — e passa a ser apenas o **resultado competitivo**, ao lado
de indicadores que **explicam** o resultado.

---

## As dez definições

| # | Definição | Estado |
|---|---|---|
| 1 | **Construto:** o IMD é índice de **maturidade discipular observável** — mede o que o app consegue observar institucionalmente durante o ciclo. Não é medida absoluta de todo o discipulado. | ✅ decidido |
| 2 | **Janela:** ciclo **mensal obrigatório**. O IMD do mês usa evidências produzidas **dentro do mês**. O histórico permanece para análise longitudinal, mas não interfere no ranking do ciclo. | ✅ decidido |
| 3 | **Capilaridade do IMD:** permanece **penetração** (proporção de participantes envolvidos). | ✅ decidido |
| 4 | **Alcance absoluto:** vira **indicador separado**, nunca componente da nota. | ✅ decidido |
| 5 | **Envolvimento e Profundidade:** permanecem como **indicadores explicativos**. | ✅ decidido |
| 6 | **Ausência de evidência nunca equivale a ausência de discipulado.** | ✅ decidido |
| 7 | **Dados não instrumentados** ficam fora do cálculo e **não são penalizados**. | ✅ decidido |
| 8 | **Fórmula 50/25/15/10** permanece homologada. | ✅ mantido |
| 9 | **Piso de 3 elegíveis por PG** permanece homologado. | ✅ mantido |
| 10 | **Corte de ≥ 3 critérios por pessoa** permanece homologado. | ✅ mantido |

**Leitura combinada dos itens 6 e 7 (critério V5):** onde o app não enxerga, o índice **se cala**.
"Sem Evidência Registrada" deixa de significar *"este PG não vive o discipulado"* e passa a
significar *"não há evidência instrumentada suficiente para avaliar"*.

---

## Arquitetura de leitura

Duas camadas, deliberadamente separadas:

| Camada | Conteúdo | Função |
|---|---|---|
| **IMD — resultado competitivo** | nota final · posição · categoria | **ordena** |
| **Indicadores de leitura** | Capilaridade (proporção **e** número absoluto) · Envolvimento · Profundidade | **explicam** |

### O cartão resultante

```
PG - Capelania
IMD: 51 — 2º lugar

Capilaridade ....... 75%   (3 de 4 participantes)
Envolvimento ....... 25
Profundidade ....... 37
```

Isso conta uma história honesta: *a maioria dos participantes demonstrou alguma evidência de
caminhada, mas a intensidade de interação com a jornada ainda é baixa.* O sistema pode afirmar
simultaneamente que o PG está em 2º **e** que seu envolvimento é baixo — sem contradição e sem
maquiagem em nenhuma das duas direções.

**O caso Capelania deixa de ser um problema e vira teste de validade do sistema.**

---

## A evidência que sustentou cada decisão

### Decisão 2 — janela mensal

Das 36 pessoas com evidência, **4 não agiram em agosto** e mesmo assim contavam. Efeito de fechar a
janela:

| PG | Evidência | Abrangência | Nota | Posição |
|---|---|---|---|---|
| 6 Serviço social | 5/7 → 5/7 | 71 → 71 | 56 → 56 | 1º → **1º** |
| 1 PG - Capelania | 3/4 → 3/4 | 75 → 75 | 51 → 51 | 2º → **2º** |
| 12 Deus é minha fortaleza | 3/5 → 3/5 | 60 → 60 | 43 → 43 | 3º → **3º** |
| 8 Gestão de almas | 6/11 → 6/11 | 55 → 55 | 41 → 41 | 4º → **4º** |
| **24 CONEXÃO REAL** | 3/6 → **1/6** | 50 → **17** | 40 → **24** | 5º → **7º** |
| 40 Conta as Bênçãos | 2/5 → 2/5 | 40 → 40 | 38 → 38 | 6º → **5º** |
| **5 Manutenção da Fé** | 3/9 → **1/9** | 33 → **11** | 25 → **14** | 7º → **13º** |

Total de pessoas com evidência: **36 → 32**.

**O argumento decisivo:** os quatro primeiros **não se movem**. A mudança não fabrica um novo
campeão — apenas retira evidência antiga de quem estava sendo beneficiado por histórico.

### Decisões 3 e 4 — penetração no IMD, alcance à parte

| PG | Pessoas engajadas | Cobertura | Por penetração | Por alcance |
|---|---|---|---|---|
| 8 Gestão de almas | **6** | 55% | 4º | **1º** |
| 6 Serviço social | 5 | 71% | **1º** | 2º |
| 1 PG - Capelania | 3 | 75% | **2º** | 3º *(empate de quatro)* |

Fundir as duas numa nota só faria o tamanho do PG favorecer grupos maiores, contrariando o princípio
**P3** homologado na Fase 3. Mantê-las separadas preserva o P3 **e** entrega a informação que o
alcance carrega.

### Decisões 6 e 7 — os três níveis de visibilidade

| Nível | Exemplo | Tratamento |
|---|---|---|
| 1 — registrado e institucional | estudo, oração, Mural, missões, Embaixadores | entra no IMD |
| 2 — registrado só no aparelho | **Diário Espiritual** (`ST.journal`) | fora do cálculo, **sem penalizar** |
| 3 — fora do aplicativo | presença, conversa pastoral, cuidado | fora do cálculo, **sem penalizar** |

---

## Consequências que precisam ser executadas antes da Fase 7

A decisão 2 **altera a especificação homologada da Fase 6**, que definia evidência sem recorte
temporal (limitação A-07, mantida conscientemente). Três consequências:

| # | Consequência | Estado |
|---|---|---|
| **C1** | `HOMOLOGACAO-RANKING-FASE-6.md` precisa de **nota de emenda** registrando a janela mensal. Sem isso, ficam duas fontes da verdade contraditórias. | ⏳ a fazer |
| **C2** | `BASELINE-F7-PRE-IMPLEMENTACAO.md` vira **histórico**: foi levantado sob janela aberta. Um novo baseline sob a janela fechada será necessário. | ⏳ a fazer |
| **C3** | O motor v3 (206 linhas) **implementa a janela aberta** — `contarCriteriosV3` não filtra por período. Precisará de adaptação. | ⏳ bloqueado até homologação formal |

**Nenhuma das três pode ser executada antes da homologação formal das dez definições.**

---

## Critérios que a régua resultante continua tendo de satisfazer

**Propriedades formais (Fase 3):** F1 invariância de escala · F2 monotonicidade · F3 influência
individual limitada · F4 neutralidade do dado ausente · F5 consistência de Pareto · F6 determinismo
e auditabilidade.

**Validade de construto (Fase 6.5):** V1 justificativa pastoral declarada · V2 nenhum proxy
silencioso · V3 janela declarada e respeitada · V4 definição de capilaridade explícita · V5
atividade não instrumentada não conta como ausência · V6 explicável em uma frase · V7 mudança de
construto exige nova homologação.

**Casos de regressão obrigatórios:** PG 41 FORTALEZA · PG 49 Limpando corações · PG 1 Capelania ·
PG 6 Serviço social · PG 8 Gestão de almas.

> Com a decisão 2, o **V3** passa de critério pendente a critério **atendido** — era o único da lista
> que a Fase 6 deixava em aberto.

---

## O que se destrava depois da homologação formal

1. Emendar a Fase 6 (C1) e refazer o baseline sob a janela fechada (C2).
2. **Adaptar** o motor v3 — janela mensal + separação da camada de indicadores (C3). Adaptar, não reescrever.
3. Retomar a Fase 7 (comparação paralela v2 × v3).
4. Fase 8 (promoção do v3 a oficial).
5. Só então a Mudança B (50 → 70).

---

## Estado do trabalho

| Item | Estado |
|---|---|
| Construto do IMD | **decidido, homologação formal pendente** |
| Motor v2 | oficial, intocado — é o que os usuários veem |
| Motor v3 | escrito e **inerte** (+206 linhas), não commitado, não revertido, não conforme à decisão 2 |
| Motor v1 | legado, intocado |
| Fase 7 | suspensa |
| Mudança B | congelada |
| Produção | inalterada |

---

*Fase 6.6 fechada como documento de decisão. Nenhum código, dado ou configuração foi alterado.*
