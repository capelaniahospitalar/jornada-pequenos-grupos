# AUDITORIA DO RANKING / IMD — FASE 1 (diagnóstico)

**Data:** 2026-08-18
**Escopo:** descobrir exatamente como o IMD e o Ranking dos PGs são calculados HOJE.
**Natureza:** somente leitura. Nenhuma linha de código do app foi alterada. Nenhuma gravação foi feita no Firebase.
**Fase seguinte (não iniciada):** revisão do modelo matemático.

---

## 0. Método e prova de que nada foi alterado

1. `git fetch` + `git pull` (o repositório local estava 4 commits atrás; foi atualizado antes de ler).
2. Leitura do código-fonte de `index.html` (motor do IMD, linhas ~11054 a ~11850).
3. Leitura do documento de produção no Firestore por `GET` (leitura pura, sem escrita).
4. Reprodução dos cálculos: o app publicado foi aberto **em modo de teste isolado** (`?teste=1`), que
   bloqueia leitura E escrita no Firebase nos dois pontos únicos (`fbReadDoc` e `fbWriteGrupos`), e os
   dados de produção foram carregados **apenas na memória do navegador** para rodar a própria função
   oficial do app (`classificarPgsV2()`). Ou seja: os números abaixo são os do app, não uma
   reimplementação minha — e nada saiu do navegador.

---

## 1. Onde o ranking vive

| Item | Onde |
|---|---|
| Motor oficial | `classificarPgsV2()` + `getPgIMDv2()` |
| Motor antigo (v1) | `classificarPgs()` + `getPgIMD()` — **não é chamado por nenhuma tela**; existe só como rollback via `FB_FLAGS.imdV2 = false` |
| Tela | Painel do Tutor/Coordenador → botão "🏆 Índice de Maturidade Discipular" (`renderRankingPgs`) |
| Quem vê | Somente Tutor e Coordenador. Participante nunca acessa. **O ranking não é público hoje.** |
| Persistência | **Nenhuma.** O ranking é recalculado do zero a cada abertura da tela. Existe `atualizarPgRanking()` que gravaria, mas ela não é chamada por tela nenhuma (decisão CQS: consulta não grava). |
| Histórico | **Não existe.** Não há foto semanal/mensal guardada. Não é possível dizer se um PG subiu ou desceu. |

---

## 2. Quem entra no ranking (população classificada)

Com a flag `pgStatusFiltros = false` (estado atual em produção), a regra é:

> Entra no ranking todo PG que tenha **nome preenchido OU pelo menos um participante**,
> exceto PGs de teste (nome contendo "teste qa"), e exceto PGs marcados como `institucional = true`.

Consequência medida hoje: **os 50 slots entram no ranking**, inclusive:
- PGs com **zero participante** (ex.: 11 "Conectados", 26 "Conexão", 28 "Mãos que curam", 35 "Gama", 45 "Fortaleza", 48 "Limpando corações");
- PGs marcados como `EM_FORMACAO` (9 deles) e até o slot 50 marcado `LIVRE`;
- o PG 47 "Diretoria", que **deveria** estar fora por ser institucional — mas o campo `g.institucional`
  não está gravado em nenhum PG (`institucionais = []`), então a exclusão nunca acontece na prática.

O campo `g.status` (ADR-005) **já está gravado nos 50 PGs**, mas não é usado, porque a flag está desligada.

---

## 3. Quem entra no cálculo (população de participantes)

Três filtros em cadeia, nesta ordem:

1. **Ativos** — `participantesAtivos()`: descarta quem tem `removed = true` (tombstone).
2. **Sem duplicata de nome** — mantém a primeira ocorrência de cada nome (comparação em minúsculas, sem espaços nas pontas). Duplicata com grafia diferente (ex.: "Ketellen Guedes" e "Ketelllen Guedes" no PG 6) **não** é pega.
3. **Elegíveis (carência)** — `participanteElegivelV2()`: só entra quem está cadastrado há **≥ 7 dias**
   (`PG_IMD_CARENCIA_DIAS = 7`), medido por `p.ts`. Quem não tem `ts` é considerado elegível.

Dentro dos elegíveis, define-se o **Participante com Evidência de Engajamento**: quem cumpre
**≥ 3 dos 7 indicadores** (`PG_IMD_ATIVO_MIN_INDICADORES = 3`):

| # | Indicador | Fonte | Recorte de tempo |
|---|---|---|---|
| 1 | Estudo | `progresso.contrib.estudos > 0` | **nenhum** — o último `contrib` gravado, de qualquer semana |
| 2 | Oração | `progresso.contrib.oracoes > 0` | idem |
| 3 | Bondade | `progresso.contrib.bondades > 0` | idem |
| 4 | Gratidão | `progresso.contrib.gratidao > 0` | idem |
| 5 | Missão semanal | `progresso.contrib.engajamento > 0` | idem |
| 6 | Sequência (streak) | `progresso.streak > 0` | acumulado, sem recorte |
| 7 | Embaixadores | `embaixadores["AAAA-MM"].participou` | **mês corrente** |

> Detalhe importante já documentado no código: `contrib` guarda **uma única semana** (a última em que a
> pessoa agiu, campo `weekKey`). O IMD **ignora** o `weekKey` de propósito — usa o último `contrib`
> existente, seja de qual semana for. Isso foi decisão consciente na RC3.5.3, por falta de histórico
> por participante. Exemplo real hoje: a semana corrente é `2026-W34`, e o único participante que
> sustenta o 1º lugar tem `contrib` de `2026-W33` (semana passada).

---

## 4. As cinco dimensões — fórmula exata

Todas devolvem 0–100. `pct(v, limite) = arredonda(v / limite × 100)`, limitado a 0–100.

Sejam: `E` = elegíveis do PG; `V` = elegíveis com Evidência de Engajamento.

**1) Capilaridade (peso 30%)** — quantos, não quanto.
```
Capilaridade = pct( |V| , |E| )
```

**2) Engajamento Coletivo (peso 25%)** — média simples de 3 frentes, cada uma "% de pessoas que têm algum registro":
```
oracaoPct    = pct( elegíveis com contrib.oracoes > 0 , |E| )
relacPct     = pct( elegíveis com contrib.bondades > 0 OU contrib.gratidao > 0 , |E| )
missaoSemPct = pct( elegíveis com contrib.engajamento > 0 , |E| )
Engajamento  = arredonda( (oracaoPct + relacPct + missaoSemPct) / 3 )
```

**3) Missão Coletiva (peso 20%)** — só Embaixadores do mês corrente:
```
Missao = pct( elegíveis com embaixadores[mês].participou , |E| )
```

**4) Regularidade (peso 15%)** — herdada sem alteração da antiga "Fidelidade" (`calcularFidelidadeScore`):
```
encontros   = g.reunioesMes[mês corrente].encontros   (registro manual do coordenador)
presencaPct = pct( soma dos presentes , soma dos totais )

se o PG NÃO tem dia de reunião cadastrado (g.diaReuniao vazio):
    Regularidade = presencaPct            ← sai pela porta antes, sem exigir frequência

senão:
    esperadas       = quantas vezes o dia cadastrado cai no mês (contado no calendário)
    regularidadePct = pct( nº de encontros registrados , esperadas )
    Regularidade    = arredonda( presencaPct × 0,5 + regularidadePct × 0,5 )
```

**5) Profundidade (peso 10%)** — só entre os que já têm Evidência (`V`):
```
estudosPct   = pct( média de progresso.estudosConcluidos em V , 13 )   (13 = STUDIES.length)
streakPct    = pct( média de min(streak, 7) em V , 7 )                 (7 = MAX_STREAK_DAYS)
Profundidade = arredonda( (estudosPct + streakPct) / 2 )
```

**Nota:** existe uma 6ª dimensão declarada, `evolucao`, com **peso 0** — reservada, nunca implementada
(falta o histórico por participante).

---

## 5. Nota final, categoria, desempate e percentil

**Nota (IMD):**
```
IMD = arredonda( Capilaridade×0,30 + Engajamento×0,25 + Missao×0,20 + Regularidade×0,15 + Profundidade×0,10 )
```

**Categoria** — NÃO usa a nota. Usa um "portão" de duas chaves, checado do topo para baixo; vence o
primeiro nível em que as DUAS condições batem:

| Categoria | Exige Capilaridade ≥ | E Regularidade ≥ |
|---|---|---|
| Altamente Engajado | 75 | 70 |
| Engajado | 60 | 50 |
| Engajamento Moderado | 40 | 30 |
| Baixo Engajamento | — (basta Capilaridade > 0) | — |
| Não Engajado | Capilaridade = 0 | — |

**Desempate** (nunca sorteio), nesta ordem: `totalScore` → `capilaridade` → `regularidade` →
`engajamento` → `missao` → `profundidade`. Empate real = mesma posição (padrão esportivo 1,2,2,4).

**Percentil:** `pct = (total de PGs − posição) / total de PGs`. Só aparece no card do motor antigo;
o card oficial (v2) mostra IMD, Categoria, Capilaridade e nº de participantes.

---

## 6. Reprodução numérica com dado real de produção (18/08/2026)

**PG 41 "FORTALEZA" — 1º lugar, IMD 78**
- 3 participantes. Dois cadastrados há 4 e 5 dias → **em carência, fora da conta**. Sobra 1 elegível.
- Essa 1 pessoa cumpre 6 dos 7 indicadores (`contrib` da semana 2026-W33), participou dos Embaixadores, streak 2, 3 estudos concluídos.
- Capilaridade = 1/1 = **100** · Engajamento = (100+100+100)/3 = **100** · Missão = 1/1 = **100**
- Regularidade = nenhum encontro registrado em agosto = **0**
- Profundidade = (pct(3, 13) + pct(2, 7)) / 2 = (23 + 29)/2 = **26**
- IMD = 100×0,30 + 100×0,25 + 100×0,20 + 0×0,15 + 26×0,10 = 30+25+20+0+2,6 = 77,6 → **78** ✔
- Categoria: Capilaridade 100 mas Regularidade 0 → nenhum portão abre → **"Baixo Engajamento"**.

**PG 6 "Serviço social" — 2º lugar, IMD 48**
- 9 participantes, 8 elegíveis, 5 com Evidência → Capilaridade = **63**
- Engajamento = **34** · Missão = 3/8 = **38** · Profundidade = **27**
- Regularidade: 2 encontros em agosto (6/8 e 8/8 presentes) → presença = 14/16 = 88%. Dia cadastrado =
  Sexta-feira; agosto/2026 tem 4 sextas → frequência = 2/4 = 50%. → (88+50)/2 = **69**
- IMD = 18,9 + 8,5 + 7,6 + 10,35 + 2,7 = 48,05 → **48** ✔
- Categoria: Capilaridade 63 ≥ 60 e Regularidade 69 ≥ 50 → **"Engajado"**.

**PG 40 "Conta as Bênçãos" — 3º lugar, IMD 46**
- 5 participantes, 5 elegíveis, 2 com Evidência → Capilaridade = **40**
- Engajamento = **53** · Missão = 1/5 = **20** · Profundidade = **19**
- Regularidade: 1 encontro (5/5 presentes) = presença 100%. **Não tem dia de reunião cadastrado**, então
  a fórmula devolve só a presença → **100**
- IMD = 12 + 13,25 + 4 + 15 + 1,9 = 46,15 → **46** ✔

As três reproduções fecham exatamente com o que o app calcula. **A fórmula está compreendida e validada.**

---

## 7. Fotografia do sistema hoje

| Indicador | Valor |
|---|---|
| PGs classificados | 50 (de 50 slots) |
| Participantes ativos no sistema | 195 |
| Em carência (< 7 dias, fora da conta) | 29 (15%) |
| Elegíveis | 166 |
| Com Evidência de Engajamento | 34 |
| Taxa de conversão | **20%** |
| PGs com pelo menos 1 pessoa com Evidência | 17 de 50 |
| Média de indicadores por participante | 1,5 de 7 |
| PGs com nota 0 | **32** (todos empatados na 19ª posição, todos com percentil 62%) |
| PGs com menos de 3 elegíveis | 26 |
| PGs com zero elegível | 13 |
| PGs com Regularidade 0 | **45** |
| PGs que registraram algum encontro em agosto | **5** (6, 17, 24, 40, 49) |

Top 18 (os demais têm nota 0):

| # | PG | IMD | Categoria | Part. | Eleg. | Evid. | Cap | Eng | Mis | Reg | Prof |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 41 FORTALEZA | 78 | Baixo Engajamento | 3 | 1 | 1 | 100 | 100 | 100 | 0 | 26 |
| 2 | 6 Serviço social | 48 | Engajado | 9 | 8 | 5 | 63 | 34 | 38 | 69 | 27 |
| 3 | 40 Conta as Bênçãos | 46 | Eng. Moderado | 5 | 5 | 2 | 40 | 53 | 20 | 100 | 19 |
| 4 | 1 PG - Capelania | 37 | Baixo Engajamento | 4 | 4 | 3 | 75 | 25 | 25 | 0 | 37 |
| 5 | 24 CONEXÃO REAL | 37 | Eng. Moderado | 6 | 6 | 3 | 50 | 56 | 0 | 46 | 14 |
| 6 | 12 Deus é minha fortaleza P1 | 31 | Baixo Engajamento | 5 | 4 | 2 | 50 | 33 | 25 | 0 | 23 |
| 7 | 8 Gestão de almas | 30 | Baixo Engajamento | 11 | 10 | 5 | 50 | 17 | 40 | 0 | 29 |
| 8 | 5 Manutenção da Fé | 19 | Baixo Engajamento | 9 | 9 | 3 | 33 | 22 | 11 | 0 | 12 |
| 9 | 16 Lugar de Transformação | 19 | Baixo Engajamento | 3 | 3 | 1 | 33 | 0 | 33 | 0 | 23 |
| 10 | 17 Maranata | 19 | Baixo Engajamento | 12 | 12 | 2 | 17 | 6 | 17 | 42 | 26 |
| 11 | 2 Foco no alto | 17 | Baixo Engajamento | 4 | 4 | 1 | 25 | 8 | 25 | 0 | 29 |
| 12 | 34 Beta | 17 | Baixo Engajamento | 6 | 6 | 1 | 17 | 11 | 33 | 0 | 22 |
| 13 | 15 DEUS SALVA VIDA | 14 | Baixo Engajamento | 4 | 4 | 1 | 25 | 0 | 25 | 0 | 15 |
| 14 | 42 Autorizados por Deus | 10 | Baixo Engajamento | 7 | 6 | 1 | 17 | 0 | 17 | 0 | 19 |
| 15 | 4 Multibençãos | 9 | Baixo Engajamento | 13 | 12 | 1 | 8 | 8 | 8 | 0 | 26 |
| 16 | 49 Limpando corações | 9 | **Não Engajado** | 8 | 0 | 0 | 0 | 0 | 0 | 63 | 0 |
| 17 | 29 Ide | 8 | Baixo Engajamento | 9 | 8 | 1 | 13 | 4 | 13 | 0 | 4 |
| 18 | 21 Recepcionando Vidas | 8 | Baixo Engajamento | 8 | 8 | 1 | 13 | 0 | 13 | 0 | 11 |

---

## 8. Achados

Classificação: **[E]** distorção estrutural do modelo · **[D]** qualidade de dado · **[G]** governança/uso.

**A-01 [E] — Denominador minúsculo vale tanto quanto denominador grande.**
Todas as dimensões são percentuais sobre o próprio PG. Um PG com 1 elegível que faz tudo tira 100 em três
dimensões; um PG com 10 elegíveis e 5 engajados tira 50. Hoje isso decide o 1º lugar: FORTALEZA (1 pessoa)
supera Serviço Social (5 pessoas engajadas de 8) por 30 pontos. Não há nenhum piso de tamanho, nem
correção por confiança estatística.

**A-02 [E] — A carência de 7 dias funciona como filtro de conveniência.**
Quem entrou há menos de 7 dias some do denominador. No PG 41, dois dos três membros estão em carência —
o PG é medido como se tivesse 1 pessoa. 29 dos 195 participantes (15%) estão nessa situação. Efeito
colateral: **inscrever gente nova pode aumentar a nota**, porque os novos não diluem.

**A-03 [E] — Nota alta e categoria ruim no mesmo cartão.**
Nota e categoria usam critérios diferentes (nota = média ponderada das 5; categoria = portão de
Capilaridade + Regularidade). Resultado real hoje: o **1º lugar aparece como "Baixo Engajamento"**, e o
16º colocado aparece como "Não Engajado" com nota 9. É incoerente para quem lê.

**A-04 [E] — Regularidade decide a categoria, mas quase ninguém alimenta o dado.**
Só 5 dos 50 PGs registraram encontro em agosto; 45 têm Regularidade 0. Como "Engajado" exige
Regularidade ≥ 50, a categoria hoje mede na prática **"o coordenador registra reunião no app?"**, não
maturidade discipular. (Consistente com o que já se sabia: `reunioesMes` não é proxy de atividade.)

**A-05 [E] — Não cadastrar o dia de reunião dá vantagem.**
Se `g.diaReuniao` está vazio, a Regularidade é só o percentual de presença — o PG não é cobrado por
frequência. O PG 40 tirou **100** de Regularidade com 1 encontro no mês inteiro, enquanto o PG 6, que
registrou 2 encontros e tem dia cadastrado, tirou 69.

**A-06 [D] — Encontro registrado não é conferido contra o dia cadastrado.**
O PG 6 tem "Sexta-feira" cadastrado e registrou encontros em 05/08 e 12/08 (quartas-feiras). A fórmula
compara só a *quantidade* de encontros com a quantidade de sextas do mês.

**A-07 [E] — Os indicadores não têm recorte de tempo.**
`contrib` guarda uma semana só e o IMD ignora qual. Uma pessoa que agiu uma vez, há semanas, continua
contando como "com Evidência" indefinidamente. Hoje o 1º lugar é sustentado por dados da semana passada
(W33, sendo a atual W34). Limitação já assumida no código, mas ela mistura "está ativo" com "já esteve".

**A-08 [E] — Empate em massa e percentil enganoso.**
32 PGs com nota 0 ficam todos na 19ª posição — e o percentil os coloca em "62%". Um PG sem nenhum dado
aparece acima da metade da tabela.

**A-09 [G] — Slots vazios e PGs em formação entram no ranking e nos denominadores.**
Os 50 slots são classificados, incluindo PGs com zero participante e 9 marcados `EM_FORMACAO` + 1 `LIVRE`.
Isso infla o "de 50" em todos os agregados ("17 de 50 PGs com Evidência") e empurra o percentil.
O campo `status` já existe gravado nos 50; a flag `pgStatusFiltros` que o usaria está **desligada**.

**A-10 [G] — A exclusão de PG institucional nunca acontece.**
`classificarPgsV2()` exclui `g.institucional === true`, mas nenhum PG tem esse campo gravado. O PG 47
"Diretoria" está no ranking.

**A-11 [D] — Duplicatas de pessoa só são pegas por nome idêntico.**
O deduplicador compara nome normalizado. No PG 6 convivem "Ketellen Guedes" e "Ketelllen Guedes"; nomes
de participante como "Colaborador 1 (nome a confirmar)" (PG 40) contam como pessoa no denominador.

**A-12 [D] — Nomes de PG repetidos.**
"Limpando corações" aparece nos slots 25, 48 e 49; "Plantão B Hotelaria" em 7 e 13; "Manutenção da Fé" em
5 e 32; "Foco no alto" em 2 e 38; "Fortaleza"/"FORTALEZA" em 41 e 45. No ranking eles aparecem como
entradas distintas com o mesmo nome.

**A-13 [G] — Não há histórico nem tendência.**
O ranking é recalculado ao vivo e nada é guardado. Não existe "subiu/desceu", nem foto do fechamento de um
ciclo. Publicar um pódio hoje é publicar um instante que não poderá ser auditado depois.

**A-14 [G] — O ranking nunca foi público.**
Ele nasceu como ferramenta de diagnóstico do Tutor/Coordenador, com nota, categoria e comparação entre
PGs visíveis só para quem pastoreia. Divulgar o pódio muda o uso do índice: o que hoje é diagnóstico
interno passa a ser premiação — e todos os achados acima passam a ter efeito público.

**A-15 [E] — Dimensão "Evolução" com peso 0.**
Está declarada no modelo e vale nada. O IMD mede estado, nunca progresso — um PG que dobrou de
engajamento no mês não ganha nada por isso.

---

## 9. Perguntas em aberto para a Fase 2 (nenhuma decidida aqui)

1. O IMD é diagnóstico pastoral, placar de competição, ou os dois? A resposta muda o modelo inteiro.
2. Tamanho do PG deve influenciar a nota (peso, piso mínimo de elegíveis, correção de confiança)?
3. Nota e categoria devem continuar sendo critérios independentes?
4. Qual a janela de tempo do índice: ciclo, mês, últimas N semanas? (Exige decidir se passa a existir histórico por participante.)
5. Regularidade deve continuar valendo 15% enquanto só 10% dos PGs alimentam o dado?
6. Quem entra no ranking: só `ATIVO`? só com um número mínimo de elegíveis? PG institucional fora de fato?
7. Deve existir um índice separado para "evolução/progresso", ao lado do de estado?

---

*Fim da Fase 1. Nenhuma alteração de código foi feita ou proposta neste documento.*
