# HOMOLOGAÇÃO MATEMÁTICA DO NOVO RANKING — FASE 6

> ## ✅ STATUS: **HOMOLOGADA** em 18/08/2026 · **⚠️ COM EMENDA 1**
>
> Todas as regras — matemáticas e não matemáticas — estão fechadas. Ver **"Decisões finais"** ao fim
> do documento.
>
> **⚠️ LEIA A EMENDA 1 (final do documento) ANTES DE IMPLEMENTAR.** A Fase 6.6 restringiu a
> evidência do IMD competitivo ao **ciclo mensal vigente**. A matemática desta especificação
> permanece integralmente válida; o que mudou foi a **janela de observação**. O texto original está
> preservado sem edição — a emenda não revoga, acrescenta.
>
> **Esta especificação é a fonte da verdade da Fase 7.** A implementação deve implementá-la como
> está: **não reinterpretar, não "melhorar" e não reabrir** a fórmula, os pesos, os cortes ou os
> limiares durante a programação. Qualquer mudança exige nova homologação — e só é cabível se os
> testes de implementação revelarem uma **inconsistência objetiva**, nunca uma preferência.

**Data:** 18/08/2026 · **Base:** Fases 1 a 5
**Natureza:** proposta **única** para homologação. Não é mais uma coleção de alternativas.
**Estado do código:** nada implementado. Todos os números foram calculados fora do app, sobre uma
cópia dos dados de produção carregada em memória, em modo de teste isolado.

---

## 0. Uma correção da Fase 4, antes de tudo

A Fase 4 recomendou o **Modelo A** (cobertura pura), com o argumento de que ele dava a mesma ordem
que o Modelo B e era mais simples. A Fase 5 mostrou que esse argumento não sobrevive: o Modelo A
**empata seis cenários completamente diferentes em 100** assim que os PGs começarem a ir bem — ele
funciona hoje e quebra exatamente quando o projeto der certo.

O Modelo B não tem esse defeito. Os únicos empates que ele produz são entre PGs com **o mesmo
perfil em tamanhos diferentes** — e isso não é falha, é a propriedade F1 (invariância de escala)
sendo respeitada, resolvida depois no desempate.

**Decisão: o modelo adotado é o B, com as correções da Fase 5.** É o que está especificado abaixo.

---

## 1. Fórmula definitiva

```
IMD = 0,50 × Abrangência  +  0,25 × Envolvimento  +  0,15 × Missão  +  0,10 × Profundidade
```

Todas as quatro grandezas valem de 0 a 100. O resultado é arredondado a inteiro.

## 2. Pesos definitivos e por que cada um

| Dimensão | Peso | Justificativa |
|---|---|---|
| **Abrangência** | **50%** | É o que "Pequeno **Grupo**" significa. Dimensão dominante por decisão (P6.3): nenhuma outra compensa uma abrangência baixa. |
| **Envolvimento** | **25%** | Segunda pergunta: além de estarem engajados, em quantas frentes o grupo age. |
| **Missão** | **15%** | Embaixadores é mensal e depende de campanha ativa — não pode pesar como a vida semanal do grupo. |
| **Profundidade** | **10%** | Mantido baixo de propósito, para não recriar o viés de concentração que originou esta auditoria. |

Nenhum peso é número solto: cada um vira constante nomeada no código, com este documento como
justificativa.

## 3. Critérios elegíveis

**Seis critérios** (o sétimo foi removido):

| # | Critério | Fonte |
|---|---|---|
| 1 | Estudo concluído | `contrib.estudos > 0` |
| 2 | Oração registrada | `contrib.oracoes > 0` |
| 3 | Gratidão compartilhada | `contrib.gratidao > 0` |
| 4 | Missão semanal | `contrib.engajamento > 0` |
| 5 | Sequência ativa | `progresso.streak > 0` |
| 6 | Embaixadores no mês | `embaixadores[AAAA-MM].participou` |

**Removido — Ato de bondade:** 0 de 166 pessoas em todo o sistema (achado D-01). Um critério que
ninguém cumpre não mede nada e ainda ocupa lugar no denominador.
**Verificado em 18/08 por teste funcional:** o motor está íntegro (registrar vitória sobre obstáculo
incrementa o contador, 0 → 1/3) — o problema é de descoberta/semântica da UX, não defeito. O
critério **permanece fora** por reprovar em *praticado* na regra de admissão, e volta ao modelo
quando a correção `UX-BONDADE` criar um caminho reconhecível — com nova homologação do conjunto.

**Removido do cálculo — Regularidade:** reprovada na regra de admissão (P5). A razão é uma
distinção que vale registrar, porque é o coração da regra:

> **Missão entra; Regularidade sai** — não porque uma tem mais adesão que a outra, mas porque em
> Missão **o dado é a ação da própria pessoa**, enquanto em Regularidade **um terceiro precisa
> registrar em nome do grupo**. Um PG pode se reunir fielmente toda semana e tirar zero. Isso mede
> uso do app, não vida do grupo.

A Regularidade **continua sendo exibida** no painel do Tutor como indicador — só não pontua.

**Evidência de Engajamento:** a pessoa cumpre **3 dos 6** critérios. Manter o corte em 3 preserva a
comparabilidade com a linha de base já medida. *(A Fase 2 mostrou que baixar para 2 levaria a
conversão de 20% para 49% — decisão para o fim do ciclo, nunca no meio dele.)*

## 4. Tratamento da carência

Carência = **7 dias** desde o cadastro. O que muda é o papel dela:

| Situação | Tratamento |
|---|---|
| Pessoa em carência, **sem** evidência | Não conta — nem no numerador, nem no denominador. A carência protege quem acabou de chegar. |
| Pessoa em carência, **com** evidência | **Conta normalmente.** O dado existe; ignorá-lo seria apagar um fato. |
| Pessoa fora da carência | Conta sempre. |
| PG com menos de 3 pessoas fora da carência | **Não é medido** — vai para "Em medição" (§5). |

Isso resolve os dois casos opostos com a mesma regra: no PG 41 a carência escondia os inativos e
inflava a nota; no PG 49 escondia os ativos e zerava a nota.

## 5. PGs com poucos elegíveis — os três estados

| Estado | Quando | O que aparece |
|---|---|---|
| **CLASSIFICADO** | PG ativo, com **≥ 3 pessoas fora da carência** | Posição, nota e as quatro dimensões |
| **EM MEDIÇÃO** | PG ativo com menos de 3 pessoas fora da carência | Lista própria, **sem posição e sem nota**, como "em formação" |
| **NÃO CLASSIFICÁVEL** | Sem participantes, status ≠ ATIVO, ou institucional | Fora do ranking |

O critério é **3 fora da carência** (correção da Fase 5) — e não "maioria medível", que punia o PG
que trouxesse gente nova.

## 6. PGs de tamanhos diferentes

Nenhum termo da fórmula usa soma absoluta. Toda dimensão é proporção de pessoas dentro do próprio
PG. O tamanho entra **apenas no desempate**, nunca na nota.

Verificação obrigatória: correlação entre nota e tamanho ≈ 0. **Medido hoje: −0,01.**

## 7. Capilaridade e envolvimento — definições distintas

| | Pergunta | Cálculo (sobre a população medível) |
|---|---|---|
| **Abrangência** | Quantos do PG vivem a jornada? | pessoas com evidência ÷ pessoas medíveis |
| **Envolvimento** | Em quantas frentes o grupo age? | média de três taxas: % com oração · % com gratidão · % com missão semanal |
| **Missão** | Quantos participaram dos Embaixadores este mês? | pessoas com participação ÷ medíveis |
| **Profundidade** | Quão longe foram os que caminham? | média de (estudos ÷ 13) e (sequência ÷ 7), **só entre quem tem evidência** |

As quatro aparecem sempre no cartão, ao lado da nota. Nenhuma pode ser omitida.

## 8. Normalização

- Toda dimensão é normalizada **dentro do próprio PG** — sempre "pessoas sobre pessoas".
- Profundidade normaliza por tetos fixos e declarados: **13 estudos** (`STUDIES.length`) e
  **7 dias** de sequência (`MAX_STREAK_DAYS`).
- Todo percentual é limitado a 0–100, mesmo que o valor bruto ultrapasse.
- Nenhuma normalização usa a média do sistema: a nota de um PG **não depende do desempenho dos
  outros**. Foi por isso que o modelo bayesiano (C) foi descartado — nele um PG sem ninguém
  engajado recebia de 7 a 12 pontos emprestados da média alheia.

## 9. Arredondamento

Cada dimensão é arredondada a inteiro **antes** da ponderação; a nota final é arredondada depois.
Meio para cima (`Math.round`).

Isso é deliberado e custa alguma precisão: a alternativa (arredondar só no fim) daria uma nota
ligeiramente mais exata, mas **as quatro dimensões exibidas no cartão não fechariam a conta**. A
transparência vence a terceira casa decimal — é o princípio já vigente no projeto desde a RC4.8.1-3.

**Verificado:** em todos os 24 PGs classificados, a nota exibida é reconstruível a partir das quatro
dimensões exibidas.

## 10. Desempate

Ordem declarada, determinística, **nunca sorteio**:

**1º** Abrangência · **2º** Envolvimento · **3º** Profundidade · **4º** nº de pessoas medíveis · **5º** menor número de PG

Empate real permanece empate (padrão esportivo 1, 2, 2, 4). O tamanho só é acionado quando tudo
mais empatou — é onde ele pode entrar sem ferir o princípio P3.

## 11. Categorias

Derivadas da **Abrangência**, não de um critério paralelo:

| Categoria | Exige Abrangência |
|---|---|
| Altamente Engajado | ≥ 75% |
| Engajado | ≥ 60% |
| Engajamento Moderado | ≥ 40% |
| Baixo Engajamento | > 0 |
| Sem Evidência Registrada | 0 |

Duas mudanças em relação a hoje:
1. **Some a incoerência A-03.** Hoje a categoria usa Capilaridade **e** Regularidade, o que produz
   um 1º lugar rotulado "Baixo Engajamento". Agora nota e categoria bebem da mesma fonte.
2. **"Não Engajado" vira "Sem Evidência Registrada"** — porque é isso que o dado sustenta. O índice
   mede o que foi registrado no app, não a vida do grupo (limitação S-04).

## 12. Proteção contra concentração numa única pessoa

Três camadas, nesta ordem:

1. **Piso de 3 pessoas fora da carência** para entrar no ranking → nenhuma pessoa isolada responde
   por mais de **1/3** de qualquer dimensão. Medido hoje: menor PG classificado tem 3 medíveis →
   **influência individual máxima de 33%**.
2. **Estado "Em medição"** para quem está abaixo do piso — o PG não recebe nota alta nem baixa.
3. **Abrangência com peso dominante** — subir exige mais pessoas, nunca uma pessoa fazendo mais.

Sem nenhuma dessas camadas, o PG 41 lidera com 78 pontos apoiado numa única pessoa. Com elas, ele
sai do ranking até ter grupo medível.

---

## O algoritmo inteiro, em uma página

```
Para cada PG:
  ativos    = participantes não removidos, sem duplicata de nome
  fora      = ativos cadastrados há 7 dias ou mais
  medíveis  = fora  ∪  {em carência que já têm evidência}
  evidência = cumpre ≥ 3 dos 6 critérios

  SE ativos = 0, ou status ≠ ATIVO, ou institucional  → NÃO CLASSIFICÁVEL
  SE |fora| < 3                                       → EM MEDIÇÃO
  SENÃO                                               → CLASSIFICADO:

     n = |medíveis|
     Abrangência  = round(evidência / n × 100)
     Envolvimento = round(( %oração + %gratidão + %missão semanal ) / 3)
     Missão       = round(%embaixadores do mês)
     Profundidade = round(( média(estudos)/13 + média(min(streak,7))/7 ) / 2 × 100)
                    calculada só entre os que têm evidência

     IMD = round(0,50·Abrangência + 0,25·Envolvimento + 0,15·Missão + 0,10·Profundidade)

Ordenar por IMD; desempate: Abrangência → Envolvimento → Profundidade → n → menor número de PG
Categoria pela Abrangência
```

---

## O ranking, se a fórmula nova estivesse ativa hoje

**Por que 24 e não 43.** Dos 50 slots: **11 não classificáveis** (10 vazios `EM_FORMACAO` + o slot
50 marcado `LIVRE`), **15 em medição** (menos de 3 pessoas fora da carência), **24 classificados**.
Os 43 provavelmente vêm da contagem de slots com algum dado — mas ter dado não é o mesmo que ter
base para ser medido.

| # | PG | IMD | Abr. | Env. | Mis. | Prof. | Evidência | Categoria |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 PG - Capelania | **51** | 75 | 25 | 25 | 37 | 3 de 4 | Altamente Engajado |
| 2 | 6 Serviço social | **49** | 63 | 38 | 38 | 27 | 5 de 8 | Engajado |
| 3 | 12 Deus é minha fortaleza P1 | **43** | 60 | 33 | 20 | 19 | 3 de 5 | Engajado |
| 4 | 8 Gestão de almas | **41** | 55 | 18 | 45 | 25 | 6 de 11 | Eng. Moderado |
| 5 | 24 CONEXÃO REAL | **40** | 50 | 56 | 0 | 14 | 3 de 6 | Eng. Moderado |
| 6 | 40 Conta as Bênçãos | **38** | 40 | 53 | 20 | 19 | 2 de 5 | Eng. Moderado |
| 7 | 5 Manutenção da Fé | 25 | 33 | 22 | 11 | 12 | 3 de 9 | Baixo Engajamento |
| 8 | 16 Lugar de Transformação | 24 | 33 | 0 | 33 | 23 | 1 de 3 | Baixo Engajamento |
| 9 | 2 Foco no alto | 21 | 25 | 8 | 25 | 29 | 1 de 4 | Baixo Engajamento |
| 10 | 15 DEUS SALVA VIDA | 18 | 25 | 0 | 25 | 15 | 1 de 4 | Baixo Engajamento |
| 11 | 34 Beta | 18 | 17 | 11 | 33 | 22 | 1 de 6 | Baixo Engajamento |
| 12 | 17 Maranata | 15 | 17 | 6 | 17 | 26 | 2 de 12 | Baixo Engajamento |
| 13 | 4 Multibençãos | 14 | 15 | 10 | 8 | 28 | 2 de 13 | Baixo Engajamento |
| 14 | 42 Autorizados por Deus | 13 | 17 | 0 | 17 | 19 | 1 de 6 | Baixo Engajamento |
| 15 | 29 Ide | 10 | 13 | 4 | 13 | 4 | 1 de 8 | Baixo Engajamento |
| 16 | 21 Recepcionando Vidas | 10 | 13 | 0 | 13 | 11 | 1 de 8 | Baixo Engajamento |
| 17 | 23 DIAGNOSTICO DE ESPERANÇA | 0 | 0 | 0 | 0 | 0 | 0 de 8 | Sem Evidência Registrada |
| 18 | 9 PÃO DA VIDA | 0 | 0 | 0 | 0 | 0 | 0 de 7 | Sem Evidência Registrada |
| 19 | 10 Primícias | 0 | 0 | 0 | 0 | 0 | 0 de 7 | Sem Evidência Registrada |
| 20 | 3 Higienização plantão B | 0 | 0 | 0 | 0 | 0 | 0 de 5 | Sem Evidência Registrada |
| 21 | 46 HEMOGLOBINA ESPIRITUAL | 0 | 0 | 0 | 0 | 0 | 0 de 5 | Sem Evidência Registrada |
| 22 | 18 Amigos | 0 | 0 | 0 | 0 | 0 | 0 de 4 | Sem Evidência Registrada |
| 23 | 19 Farol | 0 | 0 | 0 | 0 | 0 | 0 de 3 | Sem Evidência Registrada |
| 24 | 37 Plantão noite A | 0 | 0 | 0 | 0 | 0 | 0 de 3 | Sem Evidência Registrada |

Sistema: 154 pessoas medíveis, 36 com evidência.

### Conferência manual dos dois primeiros

**PG 1** — 4 medíveis (Wladimir 3 critérios, Uálace 4, Renan 3, Josué 0).
Abrangência 3/4 = 75 · Envolvimento (oração 1/4=25 + gratidão 0 + missão 2/4=50)/3 = 25 ·
Missão 1/4 = 25 · Profundidade: estudos (6+6+5)/3 ÷13 = 44, sequência (1+3+2)/3 ÷7 = 29 → 37.
**IMD = 37,5 + 6,25 + 3,75 + 3,7 = 51,2 → 51** ✔

**PG 6** — 8 medíveis, 5 com evidência.
Abrangência 63 · Envolvimento (oração 4/8=50 + gratidão 2/8=25 + missão 3/8=38)/3 = 38 ·
Missão 3/8 = 38 · Profundidade: estudos 2,8÷13 = 22, sequência 2,2÷7 = 31 → 27.
**IMD = 31,5 + 9,5 + 5,7 + 2,7 = 49,4 → 49** ✔

---

## Quem sobe, quem desce, e por quê

Comparação com o algoritmo de 23/07/2026 rodando hoje, restrito aos mesmos 24 PGs — para isolar o
efeito da fórmula do efeito da mudança de população.

| PG | Hoje | Novo | Δ | Causa |
|---|---|---|---|---|
| 41 FORTALEZA | **1º (78)** | **sai** | — | 1 pessoa medível de 3 — vai para "Em medição" |
| 1 PG - Capelania | 3º (37) | **1º (51)** | +2 | Abrangência 75 passou a valer 50% em vez de 30%; não tinha Regularidade a perder |
| 6 Serviço social | 1º (49) | 2º (49) | −1 | Perdeu os 69 de Regularidade, mas ganhou peso na Abrangência — quase compensou |
| 12 Deus é minha fortaleza | 5º (31) | 3º (43) | +2 | Abrangência subiu de 50 para 60 (a pessoa em carência com evidência passou a contar) |
| 8 Gestão de almas | 6º (30) | 4º (41) | +2 | Mesma causa: 10 → 11 medíveis, Abrangência 50 → 55 |
| 24 CONEXÃO REAL | 3º (37) | 5º (40) | −2 | Perdeu 46 de Regularidade |
| 40 Conta as Bênçãos | 2º (46) | 6º (38) | **−4** | Perdeu os **100 de Regularidade que vinham de não ter dia de reunião cadastrado** (distorção G-02) |
| 17 Maranata | 7º (19) | 12º (15) | **−5** | Perdeu 42 de Regularidade; Abrangência de 17% não sustenta posição |
| 49 Limpando corações | 16º (9) | **sai** | — | 8 pessoas, todas com 3–4 dias — nenhuma fora da carência |
| 37 Plantão noite A | 19º (0) | 24º (0) | — | **Entra** no ranking (3 pessoas fora da carência), na última posição |

**O padrão é limpo:** quem sobe são os PGs cuja força está em *quantas pessoas caminham*; quem
desce são os que tinham nota apoiada em **Regularidade** — o indicador que media se o coordenador
registrava reunião. Nenhum PG mudou de posição por tamanho.

**Saem do ranking 26 PGs**, todos por falta de base para medição, não por desempenho: 11 sem
participantes ou fora de atividade, e 15 com menos de 3 pessoas fora da carência (13 deles têm 1 ou
2 participantes no total).

---

## O 1º lugar depende de um dado que ainda não foi corrigido

O PG 6 tem dois registros: **"Ketellen Guedes"** (3 critérios) e **"Ketelllen Guedes"** com três
"l" (1 critério) — a duplicata D-08, encontrada na Fase 2 e nunca resolvida. O deduplicador só pega
nomes idênticos, então as duas contam como pessoas diferentes e **inflam o denominador do próprio PG**.

| Cenário | Abrangência | IMD | Posição |
|---|---|---|---|
| Com a duplicata (situação atual) | 5 de 8 = 63 | **49** | 2º |
| Se for a mesma pessoa | 5 de 7 = 71 | **55** | **1º** |

**O 1º lugar entre PG 1 e PG 6 depende de saber se Ketellen e Ketelllen são a mesma pessoa.**
Isso não se decide por algoritmo — precisa de conferência humana antes de qualquer publicação.

E vale registrar o que já apontei na Fase 4: o PG 1 é o PG da própria Capelania, e seus quatro
participantes são os tutores do projeto. O dado é legítimo, mas a leitura pública de um ranking
criado pela Capelania com a Capelania em 1º lugar é uma decisão de comunicação, não técnica.

---

## Testes de aceitação

| ID | Teste | Resultado |
|---|---|---|
| TA-01 | PG 41 (1 medível de 3) não lidera | ✅ fora do ranking |
| TA-02 | PG pequeno (3 pessoas) segue classificado | ✅ PG 16 em 8º, PG 19 e 37 classificados |
| TA-03 | Correlação nota × tamanho ≈ 0 | ✅ **−0,01** |
| TA-04 | PGs 41 e 49 sem posição; 49 não rotulado "Não Engajado" | ✅ ambos "Em medição" |
| TA-05 | Critério sem dado não penaliza | ✅ bondade e Regularidade fora do cálculo |
| TA-06 | Muitos caminhando > um caminhando fundo | ✅ 40 × 30 |
| TA-08 | Pessoa sem evidência nunca aumenta a nota | ✅ maior variação: **0** |
| TA-09 | Dobrar o PG não muda a nota | ✅ diferença máxima: **0** |
| TA-10 | Consistência de Pareto | ✅ **0 violações** |
| TA-11 | Cartão reconstrói a nota | ✅ nos 24 PGs |
| TA-12 | Influência individual máxima | ✅ **33%** (piso de 3) |

TA-07 (ranking reconstruível a partir do retrato gravado) **não pôde ser testado**: depende de uma
infraestrutura que ainda não existe — ver abaixo.

---

## O que falta para isto virar realidade

1. **Retrato congelado do ciclo.** Hoje o ranking é recalculado ao vivo e nada é guardado. Sem isso,
   um pódio publicado não pode ser reconferido depois. É requisito de P7.4 e bloqueia o TA-07.
2. **G-04 continua aberto:** remover participantes pouco engajados antes do fechamento eleva a nota
   (Fase 5, S-02: de 30 para 100 num caso extremo). Só se fecha por regra — congelar a população no
   início do ciclo, ou tornar as remoções visíveis no retrato.
3. **A duplicata do PG 6** e os participantes sem nome real do PG 40 ("Colaborador 1 a 4") precisam
   de decisão humana antes de qualquer divulgação.

## Decisões que ainda são suas

1. **Homologar esta proposta** — ou ajustar peso, corte ou limiar antes.
2. **Qual é o ciclo** (mês, trimestre, ou até a Semana de Oração da Primavera). Assumi o mês.
3. **Ato de bondade:** confirmar se é desuso ou defeito de tela antes de removê-lo em definitivo.
4. **Ketellen × Ketelllen** — decide o 1º lugar.
5. **PG da Capelania em 1º** — publicar ou não.

---

*Fim da Fase 6. Nenhuma linha de código foi escrita. O algoritmo aqui especificado ainda não existe
no app: o que está em produção continua sendo o de 23/07/2026.*

---

# ANEXO — Tabela de casos reais para a homologação (18/08/2026)

Exigência formulada antes da Fase 7: *"antes de qualquer código, o algoritmo deverá passar por uma
tabela de casos reais"*. Tudo abaixo é leitura e simulação fora do app.

## A.1 Esclarecimento: são duas regras, em camadas diferentes

| Regra | Onde age | O que exige |
|---|---|---|
| **Corte de 3 critérios** | **por pessoa** | conta como "com evidência" quem cumpre ≥ 3 dos 6 critérios |
| **Piso de 3 pessoas** | **por PG** | só entra no ranking quem tem ≥ 3 participantes **fora da carência** |

Pessoas em carência **não contam para atingir o piso** — não podem ser usadas para inflar o
denominador nem para alcançar o mínimo.

## A.2 Os três extremos, com dado real

| | Caso | Perfil | Eleg. (fora da carência) | Medíveis | c/ evidência | Cobertura | IMD | Resultado |
|---|---|---|---|---|---|---|---|---|
| **A** | 41 FORTALEZA | excelência concentrada | **1** | 1 | 1 | 100% | **93** | **Não classificado** (Em medição) |
| **B** | 1 PG - Capelania | desempenho distribuído | 4 | 4 | 3 | 75% | **51** | **1º lugar** |
| **B'** | 6 Serviço social | distribuído, maior | 8 | 8 | 5 | 63% | **49** | 2º lugar |
| **C** | 8 Gestão de almas | cobertura ampla, desempenho moderado | 10 | 11 | 6 | 55% | **41** | 4º lugar |
| **C'** | 17 Maranata | grande, desempenho baixo | 12 | 12 | 2 | 17% | **15** | 12º lugar |
| **espelho** | 49 Limpando corações | 8 novos, 3 já engajados | **0** | 3 | 3 | 100% | **65** | **Não classificado** (Em medição) |

A ordem A → B → C é explicável pastoralmente: **vence o PG onde mais gente caminha junto**, não o
que tem o melhor indivíduo nem o que tem mais gente no papel.

## A.3 O achado que muda o peso da decisão do piso

**Sob a fórmula nova, o FORTALEZA não tiraria 78 — tiraria 93.** Ele *sobe*, porque a Regularidade
(onde ele tirava 0) saiu do cálculo e a Abrangência, onde ele tem 100%, passou a valer 50%.

> **O piso de 3 pessoas não é um ajuste fino: é a única coisa que impede o caso FORTALEZA.**
> Sem ele, a fórmula nova seria *pior* que a atual para este caso. Homologar os pesos sem
> homologar o piso produziria um ranking mais injusto do que o de hoje.

O mesmo vale, invertido, para o PG 49: ele tiraria **65** (contra 9 hoje) e seria 1º lugar — mas
também fica fora, porque nenhuma de suas 8 pessoas completou 7 dias. Ele entra no ranking na
próxima semana, sem nada precisar ser feito.

## A.4 "Um PG com 3 elegíveis excelentes pode superar um PG com 10 bons?"

Sim — e isso é **desejado**, conforme o princípio de que um PG pequeno não pode ser condenado
automaticamente:

| Cenário | Cobertura | IMD |
|---|---|---|
| 3 elegíveis, todos com os 6 critérios | 100% | **99** |
| 10 elegíveis, todos com 4 critérios | 100% | **78** |
| 10 elegíveis, metade excelente | 50% | 54 |
| 3 elegíveis medianos (3 critérios) | 100% | 61 |

O PG de 3 vence o de 10 **apenas quando o desempenho coletivo é de fato superior** — e nunca com
menos de 3 pessoas. Um PG de 3 medianos (61) perde para 10 bons (78). O tamanho nunca decide
sozinho, em nenhuma direção.

## A.5 Tensão com o princípio "ranking é desempenho coletivo"

**Ponto que precisa de decisão explícita.** A Profundidade (10% do peso) é hoje calculada **só
entre quem tem evidência** — ou seja, é literalmente a média dos melhores indivíduos do PG, o que
contraria o princípio de que o ranking mede desempenho coletivo.

Testei a variante — Profundidade sobre **todos os medíveis**:

| PG | P (só evidência) | P (todos) | IMD oficial | IMD variante |
|---|---|---|---|---|
| 1 PG - Capelania | 37 | 27 | 51 | 50 |
| 6 Serviço social | 27 | 17 | 49 | 48 |
| 12 Deus é minha fortaleza | 19 | 20 | 43 | 43 |
| 8 Gestão de almas | 25 | 23 | 41 | 41 |

**Nenhuma mudança de posição nos 14 primeiros**; só reordena PGs com nota 0 na cauda. Custo máximo:
1 ponto.

**Recomendação:** adotar a variante (Profundidade sobre todos os medíveis). Ela alinha a fórmula ao
princípio do desempenho coletivo, elimina o único componente que premia indivíduos isolados, e
custa praticamente nada no resultado.

## A.6 O que isto significa para a homologação

| Decisão | O que os dados mostram |
|---|---|
| **Pesos 50/25/15/10** | A Abrangência dominante é o que produz a ordem A → B → C. Os outros três pesos quase não alteram posições hoje — são investimento para quando os dados amadurecerem. |
| **Corte de 3 critérios (por pessoa)** | Preserva a linha de base já medida. Baixar para 2 levaria a conversão de 20% para 49% — mudança de régua, não de fórmula. |
| **Piso de 3 pessoas (por PG)** | **É a decisão crítica.** Sozinha, ela responde pelo caso FORTALEZA. Sem ela, a fórmula nova piora o problema em vez de resolvê-lo. |
| **Base da Profundidade** | Decisão nova, surgida desta análise: calcular sobre todos os medíveis, não só sobre os melhores. |

## A.7 Sensibilidade do piso — 3 é suficiente? é excessivo?

Pergunta correta: *o piso produz competição mais justa sem eliminar PGs pequenos com discipulado
consistente?* Testado com dado real, variando só o piso:

| Piso | Classificados | FORTALEZA entra? | Pódio |
|---|---|---|---|
| **1** (sem piso real) | 37 | **SIM — lidera com 93** | FORTALEZA · Capelania · Serviço social |
| **2** | 26 | não | Capelania · Serviço social · Deus é minha fortaleza |
| **3** | **24** | não | **idêntico ao piso 2** |
| **4** | 21 | não | **idêntico ao piso 2** |
| **5** | 16 | não | Serviço social · Gestão de almas · CONEXÃO REAL (Capelania sai) |

**O piso não é um botão de ajuste fino: é binário.** Qualquer valor ≥ 2 resolve o caso FORTALEZA, e
o pódio é **idêntico** para 2, 3 e 4. A escolha entre eles não é sobre resultado, é sobre princípio.

**Por que 3, e não 2:** com 2 pessoas, uma única pessoa responde por 50% da cobertura do PG — o
problema da concentração continua, apenas menor. Com 3, a influência individual máxima cai para 33%.

**Por que 3, e não 4 ou 5:** com 5, o PG 1 (4 pessoas fora da carência) sairia do ranking apesar de
ter a maior cobertura do sistema — seria condenar um PG pequeno com discipulado real, exatamente o
que o princípio proíbe.

**3 é o menor número que limita a influência individual a 1/3 sem excluir nenhum PG que tenha
evidência real.**

### O piso está eliminando discipulado consistente?

Dos 15 PGs barrados pelo piso 3, **apenas dois têm qualquer pessoa com evidência**:

| PG barrado | Ativos | Fora da carência | Com evidência |
|---|---|---|---|
| 41 FORTALEZA | 3 | 1 | **1** |
| 49 Limpando corações | 8 | **0** | **3** |
| os outros 13 | 1 a 3 | 1 a 2 | **0** |

Treze dos quinze não têm **ninguém** com evidência — não há discipulado sendo eliminado, há ausência
de dado. E o PG 49 não é barrado pelo tamanho do piso, e sim pela carência: ele **entra sozinho na
semana que vem**, sem nenhuma intervenção.

### O piso é barreira de amostra, ou bônus por tamanho?

Caso formulado na homologação, calculado com a fórmula da Fase 6:

| Caso | Cobertura | IMD |
|---|---|---|
| **PG A** — 3 elegíveis, 3 com evidência, desempenho excelente | 100% | **99** |
| **PG B** — 10 elegíveis, 4 com evidência, desempenho moderado | 40% | **29** |
| **PG B'** — 30 elegíveis, 12 com evidência (mesma proporção de B) | 40% | **29** |

O PG pequeno excelente vence o grande moderado por **70 pontos**. E triplicar o tamanho de B não
muda **nada** — o IMD é idêntico. O piso é barreira mínima de confiabilidade da amostra; o tamanho
não entra na nota em nenhuma hipótese.

---

# HOMOLOGAÇÃO DA MATEMÁTICA — 18/08/2026

| Regra | Decisão |
|---|---|
| Pesos 50/25/15/10 | ✅ **HOMOLOGADO** |
| ≥ 3 critérios por pessoa (evidência individual) | ✅ **HOMOLOGADO** |
| ≥ 3 elegíveis por PG (amostra mínima) | ✅ **HOMOLOGADO** |
| Carência não conta para o piso | ✅ **HOMOLOGADO** |
| Tamanho absoluto não gera bônus | ✅ **HOMOLOGADO** |
| FORTALEZA como caso de regressão | ✅ **OBRIGATÓRIO** |

**Regra permanente derivada do caso FORTALEZA:**

> Um PG com apenas 1 ou 2 participantes elegíveis **jamais** ocupa posição no ranking competitivo,
> ainda que seu IMD seja 100. Isso não afirma que o discipulado dessas pessoas é ruim — afirma que
> **não há dado suficiente para comparar o desempenho coletivo do PG**.

**Arquitetura em três níveis, fechada:**

```
Nível 1 — PESSOA    ≥ 3 dos 6 critérios          → pessoa com evidência
Nível 2 — PG        ≥ 3 fora da carência         → amostra mínima para competir
Nível 3 — RANKING   fórmula 50/25/15/10          → posição
```

**A matemática da Fase 6 está fechada.** Permanecem abertas quatro pendências não matemáticas,
deliberadamente separadas da fórmula (§ abaixo). A Fase 7 só é autorizada quando elas forem
resolvidas.

---

# ANEXO B — Evidência para duas das quatro pendências (18/08/2026)

Levantamento de dados, sem nenhuma alteração. As decisões seguem sendo humanas.

## B.1 Ketellen × Ketelllen (PG 6) — a evidência é conclusiva

| | "Ketelllen Guedes" (3 L) | "Ketellen Guedes" |
|---|---|---|
| WhatsApp | *(número fora do repositório)* | **idêntico** |
| Data de inscrição | 29/07/2026 **13:46:15** | 29/07/2026 **14:51:50** |
| Tipo / departamento | colaborador / vazio | colaborador / vazio |
| memberId | `02e83f75…` | `54d80ba8…` |
| XP | 120 | **405** |
| Estudos concluídos | 0 | **2** |
| Sequência | 0 | **1** |
| Última atualização | 29/07/2026 | **12/08/2026** |
| Embaixadores | **julho/2026 ✔** | — |
| Critérios cumpridos | 1 | **3** |

**Mesmo número de WhatsApp, mesmo dia, 65 minutos de diferença.** É a mesma pessoa, cadastrada duas
vezes — o registro das 13:46 foi abandonado e o das 14:51 é o vivo (segue sendo usado até 12/08).

**Consequência no ranking:** unificando, o PG 6 passa de 5 em 8 (63%) para 5 em 7 (71%), o IMD sobe
de 49 para 55, e ele **assume o 1º lugar**, à frente do PG - Capelania (51).

**Ponto de atenção antes de qualquer correção:** o registro duplicado é o único que guarda a
participação nos **Embaixadores de julho**. Apagá-lo sem transferir esse dado perde a informação —
não afeta o ranking atual (a Missão usa o mês corrente), mas afeta o histórico.

**Defeito sistêmico que isto revela:** o app já tem proteção contra cadastro duplicado
(`buscarCadastroExistente`, do IDENT-01), mas ela compara **nome + WhatsApp**. Um erro de digitação
no nome derrota a proteção inteira. Uma verificação por WhatsApp apenas teria impedido este caso.
Candidato a correção própria — fora do escopo do ranking.

## B.2 "Ato de bondade" — não é defeito de tela, é label sem caminho

O critério é alimentado por **exatamente dois pontos** do código, e **nenhum deles se chama
"bondade" para o usuário**:

| Onde | O que a pessoa faz na prática |
|---|---|
| `registrarVitoria(id)` | Registra uma **vitória sobre um obstáculo pessoal** na tela Obstáculos |
| Missões com id contendo `serv` ou `amor` | Conclui uma missão específica de serviço/amor |

Ao mesmo tempo, a interface **exibe** o indicador em dois lugares — "❤️ Atos de bondade X/3" no
painel do PG e "Atos de bondade registrados" na Meta Semanal. Ou seja: **a pessoa vê uma barra que
promete uma coisa e só pode ser preenchida fazendo outra**, sem nenhuma indicação de qual.

Isso explica 0 de 166 sem precisar supor defeito. Some-se a isso a confusão já conhecida de existir
mais de uma tela chamada "Obstáculos".

**Teste humano sugerido (30 segundos):** abrir Obstáculos → escolher um obstáculo → registrar uma
vitória → conferir se o contador "Atos de bondade" sobe.
- **Se subir:** o mecanismo funciona; o problema é de nome/descoberta. O critério continua fora do
  ranking até existir um caminho que a pessoa reconheça.
- **Se não subir:** aí sim é defeito, e vira correção própria.

---

# DECISÕES FINAIS DA FASE 6 — 18/08/2026

## Regras matemáticas (homologadas)

| Regra | Decisão |
|---|---|
| Pesos **50/25/15/10** | ✅ HOMOLOGADO |
| **≥ 3 dos 6 critérios por pessoa** = evidência individual | ✅ HOMOLOGADO |
| **≥ 3 elegíveis por PG** = amostra mínima para competir | ✅ HOMOLOGADO |
| Carência não conta para atingir o piso | ✅ HOMOLOGADO |
| Tamanho absoluto não gera bônus | ✅ HOMOLOGADO |
| FORTALEZA como caso de regressão | ✅ OBRIGATÓRIO E PERMANENTE |

## Regras não matemáticas (homologadas)

### 1. Ciclo de apuração — HOMOLOGADO

```
Ciclo = mês-calendário
Durante o mês  → ranking PARCIAL, recalculado ao vivo, exibido como parcial
No fechamento  → RETRATO MENSAL CONGELADO, gravado
Publicável     → SOMENTE o retrato congelado
```

O parcial existe para o acompanhamento pastoral do Tutor; ele **não é resultado oficial** e não pode
ser divulgado. O retrato congelado é o único resultado oficial, e é ele que torna o **TA-07**
(ranking reconstruível) executável — hoje impossível, por não existir retrato.

### 2. "Atos de bondade" — FORA DO RANKING

Teste funcional executado em 18/08 (modo de teste isolado, zero escrita em produção): registrar uma
vitória sobre um obstáculo **incrementa** o contador (0 → 1/3). **O motor funciona.**

O critério permanece **fora do algoritmo**: ele é praticável, mas não descobrível — a interface
exibe "❤️ Atos de bondade" e o único caminho é a tela Obstáculos ou uma missão de serviço/amor, sem
nenhuma indicação. Reprova na regra de admissão (P5) por não ser *praticado*.

**Volta ao modelo** quando a correção `UX-BONDADE` criar um caminho que a pessoa reconheça — e isso
exigirá nova homologação do conjunto de critérios (passariam a ser 7).

### 3. Ketellen × Ketelllen — especificação autorizada, execução NÃO

Identidade confirmada por evidência conclusiva. **Documentar a migração é autorizado; executá-la não.**
Ordem obrigatória: **preservar histórico → consolidar → validar → neutralizar duplicata.**

Especificação em documento próprio: `ESPEC-MIGRACAO-PG6-DUPLICATA.md`.

### 4. PG da Capelania — nenhuma exceção

Não haverá regra especial para produzir nem para evitar determinado vencedor. O ranking reflete a
fórmula homologada aplicada à base de dados correta. Se a consolidação cadastral do PG 6 muda o 1º
lugar, o ranking muda junto.

---

## Baseline oficial da Fase 6

Fotografia dos dados de produção em **18/08/2026**, com a fórmula homologada, **antes** da
consolidação da duplicata do PG 6:

| | |
|---|---|
| PGs classificados | **24** (de 50 slots) |
| Em medição | 15 · Não classificáveis | 11 |
| Pessoas medíveis | 154 · com evidência | 36 |
| 1º lugar | PG 1 PG - Capelania — IMD **51** |
| 2º lugar | PG 6 Serviço social — IMD **49** |
| 3º lugar | PG 12 Deus é minha fortaleza P1 — IMD **43** |

**Após** a consolidação da duplicata (quando autorizada), o esperado é: PG 6 passa a 5/7, IMD **55**,
assumindo o 1º lugar; PG 1 vai a 2º. Nenhum outro PG é afetado.

Este baseline é o ponto de comparação da Fase 7: o motor v3 implementado deve reproduzir
**exatamente** estes números sobre os mesmos dados.

---

## O que a Fase 7 deve fazer — e o que não deve

**Deve:**
- Implementar esta especificação como está, em **modo paralelo**: v2 continua sendo o resultado
  oficial, v3 calcula em paralelo sobre os mesmos dados, resultados exibidos lado a lado.
- Reproduzir o baseline acima como primeiro teste de aceitação.
- Preservar o motor v1 intocado (referência histórica).
- Nenhuma promoção automática: v3 só vira oficial na Fase 8, por decisão explícita.

**Não deve:**
- Reinterpretar, ajustar ou "melhorar" fórmula, pesos, cortes, limiares ou categorias.
- Misturar a Mudança B (50→70 slots), que segue congelada.
- Misturar as correções `UX-BONDADE` e `IDENT-02`.
- Executar a migração do PG 6.

---

*Fase 6 encerrada. O algoritmo aqui especificado ainda não existe no app: o que está em produção
continua sendo o IMD v2 de 23/07/2026.*

---

# EMENDA 1 — Janela do ciclo mensal (Fase 6.6, 18/08/2026)

> **Esta emenda não revoga nada.** Tudo o que foi homologado em 18/08/2026 permanece válido:
> a fórmula, os pesos 50/25/15/10, o corte de ≥3 critérios por pessoa, o piso de ≥3 elegíveis por PG,
> o tratamento da carência, a normalização, o arredondamento, o desempate e as categorias.
> **O texto original acima está preservado sem edição, para rastreabilidade histórica.**

## O que muda

A especificação original definia "Evidência de Engajamento" **sem recorte temporal** — usava o
último registro da pessoa, de qualquer época. Era a limitação **A-07**, herdada da Fase 1 e mantida
conscientemente por falta de histórico por participante.

A Fase 6.5 mostrou que isso é uma incoerência de construto: declaramos "IMD de agosto" e contávamos
ação de julho. Medido em 18/08: **4 das 36 pessoas com evidência não tiveram nenhuma atividade em
agosto** e mesmo assim pontuavam.

**A partir da Fase 6.6, fica decidido:**

> ### O IMD competitivo do ciclo usa exclusivamente evidências produzidas **dentro do ciclo mensal vigente**.
>
> O histórico permanece disponível para análise longitudinal, mas **não interfere** no ranking do
> ciclo corrente.

## O que isso não muda

Nada na matemática. A fórmula, os pesos, os cortes e o piso continuam idênticos. **Muda a janela de
observação, não o cálculo.**

## Efeito medido (18/08/2026)

Pessoas com evidência: **36 → 32**. Os **quatro primeiros colocados não se movem** — a mudança não
fabrica um novo campeão, apenas retira evidência antiga de quem estava sendo beneficiado por
histórico. Caem de forma expressiva o PG 24 CONEXÃO REAL (5º → 7º) e o PG 5 Manutenção da Fé
(7º → 13º), cuja evidência era majoritariamente histórica.

## Efeito sobre os critérios de validade

O critério **V3** da Fase 6.5 ("a janela temporal é declarada e respeitada") passa de **pendente** a
**atendido** — era o único da lista que a homologação original deixava em aberto.

## Consequências documentais

- `BASELINE-F7-PRE-IMPLEMENTACAO.md` passa a ser **baseline histórico** (levantado sob janela aberta).
- O motor v3 escrito na Fase 7 **implementa a janela aberta** e precisará de adaptação — bloqueada
  até a homologação formal das dez definições da Fase 6.6.

**Fonte:** `FASE-6.6-CONSTRUTO-DO-IMD.md`, decisão 2.
