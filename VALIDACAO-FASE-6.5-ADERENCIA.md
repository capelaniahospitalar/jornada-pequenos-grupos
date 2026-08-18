# FASE 6.5 — VALIDAÇÃO DE ADERÊNCIA À REALIDADE

> ## ⏸️ A FASE 7 ESTÁ SUSPENSA
> Não por defeito de implementação — o motor v3 reproduz o baseline exatamente. Está suspensa
> porque descobrimos que **não temos certeza de que a régua mede o fenômeno que queremos medir**.
>
> **Regra de governança:** nenhuma alteração no motor v3 pode ser feita até que a **definição de
> construto do IMD** seja formalmente aprovada. Isso existe para impedir o erro que acabamos de
> identificar: otimizar matematicamente um indicador antes de ter certeza de que ele representa o
> fenômeno.

**Data:** 18/08/2026 · **Natureza:** documentação e análise. Nenhum código, nenhuma escrita no
Firestore, nenhuma publicação, nenhuma alteração da fórmula.
**Origem:** uma pergunta de campo — *"no PG Capelania praticamente só eu interajo com o aplicativo,
mas preenchemos o diário espiritual; está certa nossa colocação?"*

---

## 1. O que o IMD atual realmente mede

Dito sem eufemismo, o índice homologado na Fase 6 mede:

> **A proporção de participantes que registraram pelo menos três tipos diferentes de ação no
> aplicativo, em algum momento, ponderada por quantas frentes o grupo tocou e quão longe foram os
> que registraram.**

Essa frase é uma descrição correta e completa da régua atual. **Ela não é uma definição de
maturidade discipular** — e essa distância é o objeto desta fase.

---

## 2. O que ele não mede — os três níveis

A investigação mapeou todos os caminhos que alimentam o índice. São sete, cobrindo seis critérios:
concluir estudo · marcar oração · publicar no Mural · missões semanais · missões de serviço/oração ·
registrar vitória sobre obstáculo · confirmar Embaixadores do mês. Mais a sequência, derivada do uso.

Fora disso, o discipulado se distribui em **três níveis de visibilidade**:

| Nível | O que é | Exemplos | Situação |
|---|---|---|---|
| **1 — Registrado e institucional** | o app grava e sincroniza | estudo, oração, Mural, missões, obstáculos, Embaixadores | **é o que o IMD vê** |
| **2 — Registrado, mas só no aparelho** | o app grava localmente e **nunca envia à nuvem** | **Diário Espiritual** (`ST.journal`) | invisível ao IMD *e* à instituição |
| **3 — Acontece fora do aplicativo** | discipulado real sem rastro digital | presença física, conversa pastoral, cuidado, companheirismo, visita | invisível por natureza |

Também não alimentam nenhum critério, embora existam como telas: **Companheiro de Jornada**,
**Desafios do Discipulado**, IA bíblica, Encerramento da Jornada, Bônus. E a **presença física nos
encontros** alimentava a Regularidade — dimensão que o v3 removeu por reprovar na regra de admissão.

**Consequência:** o índice não é um termômetro de discipulado com falhas de calibração. Ele é um
termômetro de **uso instrumentado do aplicativo**, que assumimos como proxy de discipulado sem nunca
ter homologado essa suposição.

---

## 3. O problema da janela temporal

Declaramos o ciclo como **mês-calendário**. Mas a fórmula, na letra homologada, usa **o último
registro da pessoa, seja de que época for** (achado A-07 da Fase 1, mantido conscientemente na
Fase 6).

**Medição em 18/08/2026:** das 36 pessoas com evidência nos PGs classificados, **4 não tiveram
nenhuma atividade em agosto** e mesmo assim contam para o IMD de agosto.

Distribuição do último registro entre essas 36 pessoas:

| Semana do último registro | Pessoas |
|---|---|
| 2026-W34 (semana corrente) | 11 |
| 2026-W33 | 15 |
| 2026-W32 | 6 |
| 2026-W31 | 4 |

**Teste de sensibilidade** (exigindo atividade dentro do mês): evidências caem de 36 para 32, o PG
Capelania não se move, e apenas a 5ª posição muda. **Custo baixo, ganho de coerência alto.**

Isto é uma incoerência conceitual, não um erro de cálculo: estamos misturando **ciclo de avaliação
mensal** com **histórico acumulado**. Se o índice é "de agosto", quem agiu em julho não deveria
contribuir — a menos que decidamos deliberadamente que o indicador é cumulativo. Nenhuma das duas
coisas foi decidida; a fórmula apenas herdou a ausência de janela.

---

## 4. As duas definições de capilaridade

A palavra tem dois sentidos, e a régua atual escolheu um **sem que a escolha tenha sido homologada**:

| Sentido | Pergunta | Fórmula | Favorece |
|---|---|---|---|
| **Penetração** *(escolha atual)* | Que fração do grupo caminha? | engajados ÷ medíveis | grupos pequenos e coesos |
| **Alcance** | Quantas pessoas o discipulado alcançou? | nº absoluto de engajados | grupos grandes |

Os dois são defensáveis. Penetração premia coesão; alcance premia expansão. A escolha não é técnica:
depende de o projeto querer **PGs profundos** ou **PGs que multiplicam**.

**Observação metodológica:** a Fase 3 proibiu somas absolutas justamente para impedir que tamanho
virasse vantagem (princípio P3). Adotar "alcance" exigiria revisitar esse princípio — não é um ajuste
de peso, é uma mudança de fundamento.

---

## 5. O problema do Diário Espiritual

**Este é o achado mais importante desta fase.**

O Diário não é ignorado pelo IMD. Ele **não existe como dado institucional**: fica em `ST.journal`,
no armazenamento local do aparelho, nunca é sincronizado com o Firestore e nunca toca o registro do
participante.

Três consequências:

1. **Não é problema de fórmula.** Nenhum ajuste de peso o tornaria visível. Incluí-lo exige mudar o
   modelo de dados — sincronizar por participante, com tudo o que isso implica de privacidade
   (o Diário é conteúdo íntimo e devocional, não um contador).
2. **Ele é o exemplo puro do nível 2.** O grupo faz algo que consideramos discipulado; o app até
   registra; e ainda assim a instituição não enxerga.
3. **Corrigi-lo levanta uma questão pastoral séria:** *o Diário Espiritual deve virar dado
   institucional?* Tornar visível o que hoje é privado tem custo de confiança. Talvez a resposta
   correta seja sincronizar apenas o **fato** de haver registro (uma marca), nunca o conteúdo — mas
   isso é decisão do Capelão, não do algoritmo.

---

## 6. Os cinco casos qualitativos

Dados de 18/08/2026, `updateTime` `2026-08-18T16:22:43.837198Z`.

### 6.1 PG 1 — Capelania: o caso que abriu esta fase

| Pessoa | Critérios | Último registro | Sem atividade há |
|---|---|---|---|
| Wladimir | 3 | 2026-W34 (semana corrente) | 1 dia |
| Uálace | 4 | 2026-W33 | 4 dias |
| Renan | 3 | 2026-W32 | 11 dias |
| Josué | 0 | nunca | — |

**Abr 75 · Env 25 · Mis 25 · Prof 37 → IMD 51 · 2º lugar**

**A percepção de campo e o número estão ambos certos, em escalas diferentes.** Na semana corrente,
só uma pessoa agiu. No mês — que é o ciclo homologado — três das quatro agiram. O índice tem a maior
Abrangência e a maior Profundidade do sistema, e o **Envolvimento mais baixo entre os seis
primeiros** (25) — que é exatamente a tradução numérica de *"praticamente só eu interajo"*.

E o que este PG faz com constância — o Diário Espiritual — **não conta nada**.

### 6.2 PG 8 — Gestão de Almas: o contraexemplo decisivo

**11 ativos · 10 elegíveis · 11 medíveis · 6 com evidência · Abr 55 · Env 18 · Mis 45 · Prof 25 →
IMD 41 · 4º lugar**

| PG | Pessoas engajadas | Cobertura | Posição |
|---|---|---|---|
| 8 Gestão de almas | **6** | 55% | **4º** |
| 6 Serviço social | 5 | 71% | 1º |
| 1 Capelania | **3** | 75% | **2º** |

**O PG 8 tem o dobro de pessoas efetivamente engajadas do Capelania e está duas posições abaixo.**

A pergunta que ele obriga a responder: *é melhor um grupo em que 3 de 4 participam, ou um em que
6 de 11 participam?* **Não deve ser respondida matematicamente.** É uma pergunta teológica e
metodológica sobre o que o projeto quer promover.

### 6.3 PG 41 — FORTALEZA: caso de regressão permanente

3 ativos · 1 fora da carência · 1 com evidência · nota que teria: **93** · **EM MEDIÇÃO**.
Continua sendo o teste obrigatório de qualquer régua futura: **uma pessoa não pode produzir o
campeão**. Note que a régua nova o pontuaria *mais alto* que a atual (93 contra 78) — é o piso de
3 elegíveis, e somente ele, que o segura.

### 6.4 PG 49 — Limpando corações: o espelho invertido

8 ativos, todos em carência · 3 já com evidência · **EM MEDIÇÃO**.
O algoritmo atual o rotula "Não Engajado"; a régua nova se recusa a rotulá-lo. Entra sozinho quando
a carência vencer. Testa a regra oposta: **ausência de dado não é ausência de discipulado**.

### 6.5 PG 6 — Serviço social: o caso saudável

7 elegíveis · 5 com evidência · Abr 71 · Env 38 · Mis 57 · Prof 27 → **IMD 56 · 1º lugar**.
É o PG onde as três leituras convergem: boa penetração, bom alcance, atividade recente e distribuída.
Serve de referência do que a régua *deveria* premiar sob qualquer definição.

---

## 7. Três conceitos que precisam parar de ser confundidos

| Conceito | Pergunta que responde | Onde está hoje |
|---|---|---|
| **Engajamento digital** | Quanto o participante interage com a Jornada no app? | **é isto que o IMD mede hoje** |
| **Capilaridade discipular** | Quantas pessoas do PG efetivamente participam da jornada? | medida por proxy, com definição não homologada (§4) |
| **Maturidade discipular** | Há evidências de crescimento cristão e prática do discipulado? | **não é medida** |

**Definição proposta para homologação:** o IMD deve ser construído para medir **maturidade
discipular**, usando engajamento digital e capilaridade **apenas quando forem proxies válidos e
declarados como tal**. Todo componente que for proxy deve dizer que é proxy.

---

## 8. Critérios que a régua futura terá de satisfazer

As seis propriedades formais da Fase 3 (F1 invariância de escala · F2 monotonicidade · F3 influência
individual limitada · F4 neutralidade do dado ausente · F5 consistência de Pareto · F6 determinismo e
auditabilidade) **permanecem válidas** — nenhuma delas foi contestada por esta fase.

A elas somam-se sete critérios de **validade de construto**:

| # | Critério |
|---|---|
| **V1** | Cada componente tem justificativa **pastoral declarada**, não apenas estatística. |
| **V2** | Nenhum componente é proxy silencioso: onde "registrou no app" substitui "viveu", isso está escrito. |
| **V3** | A janela temporal é declarada e **respeitada** — o índice do mês usa dados do mês. |
| **V4** | A definição de capilaridade adotada (penetração ou alcance) é explícita e homologada. |
| **V5** | Atividade não instrumentada **não pode ser contada como ausência**. Onde o app não enxerga, o índice se cala — não pontua contra. |
| **V6** | O índice é explicável a um coordenador em uma frase, e reconstruível na própria tela. |
| **V7** | Mudança de construto exige **nova homologação** — não é ajuste de parâmetro. |

O **V5** é o mais exigente e o mais importante: é o que impede que o PG Capelania seja penalizado por
manter o Diário Espiritual, e que o PG 49 seja chamado de "Não Engajado" por ser novo.

---

## 9. Perguntas em aberto — a decidir antes de retomar a Fase 7

1. **O IMD pretende medir discipulado real ou a jornada discipular registrada no aplicativo?**
   *(decisão central de todo o projeto)*
2. **Capilaridade = penetração ou alcance?** (§4)
3. **O período de referência é estritamente o mês-calendário?** Se sim, a janela precisa ser fechada
   na fórmula (§3).
4. **O Diário Espiritual deve virar dado institucional?** E, se sim, só a marca de registro ou o
   conteúdo? (§5)
5. **Companheiro de Jornada, Desafios e presença física** devem entrar no construto?
6. **É melhor 3 de 4 ou 6 de 11?** (§6.2)

---

## 10. Estado do trabalho

| Item | Estado |
|---|---|
| Fase 6 — matemática | homologada, mas **em revisão de construto** |
| Motor v3 | **escrito e inerte** no `index.html` (+206 linhas, zero deleções). Não commitado, não revertido, não chamado por nenhuma tela |
| Motor v2 | oficial e intocado — é o que os usuários veem |
| Motor v1 | legado, intocado |
| Fase 7 | **suspensa** |
| Mudança B (50→70) | congelada |
| Produção | inalterada |

O v3 é preservado porque, definida a régua, ele poderá ser **adaptado** em vez de reescrito. Mas
nenhuma linha dele pode ser alterada antes da aprovação do construto (regra de governança no topo
deste documento).

---

*Fase 6.5 registrada. Nenhum código, nenhum dado e nenhuma configuração foram alterados.*
